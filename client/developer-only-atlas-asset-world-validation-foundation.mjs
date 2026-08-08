const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_WORLD_VALIDATION_FOUNDATION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_WORLD_VALIDATION_FOUNDATION_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_WORLD_VALIDATION_FOUNDATION_VERSION =
  "atlas_asset_world_validation_foundation_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_WORLD_VALIDATION_FOUNDATION_RULES =
  Object.freeze([
    Object.freeze({
      assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
      placementIntent: "vegetation_coastal_cluster",
      assetPackages: Object.freeze({
        TREE_BOTTLEBRUSH_001: Object.freeze({
          variants: Object.freeze([
            "VARIANT_TREE_BOTTLEBRUSH_COASTAL_A_001",
            "VARIANT_TREE_BOTTLEBRUSH_COASTAL_B_001"
          ]),
          materialFamilyIds: Object.freeze([
            "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001"
          ]),
          paletteProfileIds: Object.freeze([
            "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
          ]),
          lodProfileIds: Object.freeze([
            "LOD_PROFILE_TREE_STANDARD_CLOSE_MEDIUM_DISTANT_001"
          ])
        }),
        SHRUB_COASTAL_LOW_001: Object.freeze({
          variants: Object.freeze([
            "VARIANT_SHRUB_COASTAL_LOW_A_001",
            "VARIANT_SHRUB_COASTAL_LOW_B_001",
            "VARIANT_SHRUB_COASTAL_LOW_C_001"
          ]),
          materialFamilyIds: Object.freeze([
            "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001"
          ]),
          paletteProfileIds: Object.freeze([
            "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
          ]),
          lodProfileIds: Object.freeze([
            "LOD_PROFILE_SHRUB_LIGHT_CLOSE_MEDIUM_DISTANT_001"
          ])
        }),
        TREE_EUCALYPTUS_001: Object.freeze({
          variants: Object.freeze([
            "VARIANT_TREE_EUCALYPTUS_COASTAL_A_001",
            "VARIANT_TREE_EUCALYPTUS_COASTAL_B_001"
          ]),
          materialFamilyIds: Object.freeze([
            "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001"
          ]),
          paletteProfileIds: Object.freeze([
            "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
          ]),
          lodProfileIds: Object.freeze([
            "LOD_PROFILE_TREE_TALL_CLOSE_MEDIUM_DISTANT_001"
          ])
        })
      }),
      rendererHandoffReadiness: "ready_for_future_renderer_attachment",
      status: "approved"
    }),
    Object.freeze({
      assetFamilyId: "ASSET_FAMILY_CIVIC_HERITAGE_001",
      placementIntent: "civic_landmark_anchor",
      assetPackages: Object.freeze({
        BUILDING_CIVIC_SPORTS_PAVILION_001: Object.freeze({
          variants: Object.freeze([
            "VARIANT_CIVIC_HERITAGE_PAVILION_A_001",
            "VARIANT_CIVIC_HERITAGE_PAVILION_B_001"
          ]),
          materialFamilyIds: Object.freeze([
            "MATERIAL_FAMILY_WALL_HERITAGE_001"
          ]),
          paletteProfileIds: Object.freeze([
            "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001"
          ]),
          lodProfileIds: Object.freeze([
            "LOD_PROFILE_CIVIC_BUILDING_CLOSE_MEDIUM_DISTANT_001"
          ])
        })
      }),
      rendererHandoffReadiness: "ready_for_future_renderer_attachment",
      status: "approved"
    }),
    Object.freeze({
      assetFamilyId: "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001",
      placementIntent: "residential_placeholder_mass",
      assetPackages: Object.freeze({
        TREE_EUCALYPTUS_001: Object.freeze({
          variants: Object.freeze([
            "VARIANT_RESIDENTIAL_SUBURBAN_PLACEHOLDER_A_001",
            "VARIANT_RESIDENTIAL_SUBURBAN_PLACEHOLDER_B_001"
          ]),
          materialFamilyIds: Object.freeze([
            "MATERIAL_FAMILY_ROOF_SUBURBAN_001"
          ]),
          paletteProfileIds: Object.freeze([
            "PALETTE_PROFILE_SUBURBAN_GARDEN_001"
          ]),
          lodProfileIds: Object.freeze([
            "LOD_PROFILE_RESIDENTIAL_PLACEHOLDER_CLOSE_MEDIUM_DISTANT_001"
          ])
        })
      }),
      rendererHandoffReadiness: "ready_for_future_renderer_attachment",
      status: "approved"
    }),
    Object.freeze({
      assetFamilyId: "ASSET_FAMILY_COMMERCIAL_URBAN_001",
      placementIntent: "commercial_frontage_anchor",
      assetPackages: Object.freeze({
        TREE_EUCALYPTUS_001: Object.freeze({
          variants: Object.freeze([
            "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
            "VARIANT_COMMERCIAL_URBAN_FRONTAGE_B_001"
          ]),
          materialFamilyIds: Object.freeze([
            "MATERIAL_FAMILY_TRIM_URBAN_001"
          ]),
          paletteProfileIds: Object.freeze([
            "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001"
          ]),
          lodProfileIds: Object.freeze([
            "LOD_PROFILE_COMMERCIAL_PLACEHOLDER_CLOSE_MEDIUM_DISTANT_001"
          ])
        })
      }),
      rendererHandoffReadiness: "ready_for_future_renderer_attachment",
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
    atlasAssetWorldValidationVersion: state.atlasAssetWorldValidationVersion,
    registeredAtlasAssetValidationRuleCount:
      state.registeredAtlasAssetValidationRuleCount,
    atlasAssetPackageId: state.atlasAssetPackageId,
    assetValidationStatus: state.assetValidationStatus,
    bindingValidationReason: state.bindingValidationReason,
    placementValidationStatus: state.placementValidationStatus,
    rendererHandoffReadiness: state.rendererHandoffReadiness,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const assetFamilyId = sanitizeString(rule.assetFamilyId);
  const placementIntent = sanitizeString(rule.placementIntent);
  const rendererHandoffReadiness = sanitizeString(rule.rendererHandoffReadiness);
  if (!assetFamilyId) {
    throw Object.assign(new Error("MISSING_VALIDATION_ASSET_FAMILY_ID"), {
      reasonCode: "MISSING_VALIDATION_ASSET_FAMILY_ID"
    });
  }
  if (!placementIntent) {
    throw Object.assign(new Error("MISSING_PLACEMENT_INTENT"), {
      reasonCode: "MISSING_PLACEMENT_INTENT"
    });
  }
  if (!rendererHandoffReadiness) {
    throw Object.assign(new Error("MISSING_RENDERER_HANDOFF_READINESS"), {
      reasonCode: "MISSING_RENDERER_HANDOFF_READINESS"
    });
  }
  return deepFreeze({
    assetFamilyId,
    placementIntent,
    assetPackages: deepFreeze({ ...(rule.assetPackages ?? {}) }),
    rendererHandoffReadiness,
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasAssetWorldValidationVersion: version,
    registeredAtlasAssetValidationRuleCount: rules.length,
    atlasAssetPackageId: null,
    assetValidationStatus: null,
    bindingValidationReason: null,
    placementValidationStatus: null,
    rendererHandoffReadiness: null,
    lastFailureReason: null
  };
}

function chooseRule(registry, assetFamilyId) {
  return (
    registry.__rules.find((rule) => rule.assetFamilyId === assetFamilyId) ?? null
  );
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

export function createDeveloperOnlyAtlasAssetWorldValidationFoundation({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_WORLD_VALIDATION_FOUNDATION_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_WORLD_VALIDATION_FOUNDATION_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasAssetWorldValidationFoundation: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasAssetWorldValidationFoundationStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasAssetWorldValidationFoundation ||
    !registry.__state
  ) {
    return freezeStatus({
      atlasAssetWorldValidationVersion: null,
      registeredAtlasAssetValidationRuleCount: 0,
      atlasAssetPackageId: null,
      assetValidationStatus: null,
      bindingValidationReason: null,
      placementValidationStatus: null,
      rendererHandoffReadiness: null,
      lastFailureReason:
        "ATLAS_ASSET_WORLD_VALIDATION_FOUNDATION_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasAssetWorldValidationFoundation(
  registry,
  {
    assetFamilyId = null,
    selectedAssetId = null,
    assetVariantId = null,
    materialFamilyId = null,
    paletteProfileId = null,
    lodProfileId = null,
    placementIntent = null,
    coordinate = null
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasAssetWorldValidationFoundation ||
    !registry.__state
  ) {
    throw Object.assign(
      new Error("ATLAS_ASSET_WORLD_VALIDATION_FOUNDATION_UNAVAILABLE"),
      {
        reasonCode: "ATLAS_ASSET_WORLD_VALIDATION_FOUNDATION_UNAVAILABLE"
      }
    );
  }

  const normalizedAssetFamilyId = sanitizeString(assetFamilyId);
  const normalizedSelectedAssetId = sanitizeString(selectedAssetId);
  const normalizedAssetVariantId = sanitizeString(assetVariantId);
  const normalizedMaterialFamilyId = sanitizeString(materialFamilyId);
  const normalizedPaletteProfileId = sanitizeString(paletteProfileId);
  const normalizedLodProfileId = sanitizeString(lodProfileId);
  const normalizedPlacementIntent = sanitizeString(placementIntent);

  const rule = chooseRule(registry, normalizedAssetFamilyId);
  if (!rule) {
    registry.__state.atlasAssetPackageId = null;
    registry.__state.assetValidationStatus = "invalid_asset_family";
    registry.__state.bindingValidationReason = "UNKNOWN_ASSET_FAMILY";
    registry.__state.placementValidationStatus = "not_validated";
    registry.__state.rendererHandoffReadiness = "blocked";
    registry.__state.lastFailureReason = "UNKNOWN_ASSET_FAMILY";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      atlasAssetPackageId: null,
      assetValidationStatus: "invalid_asset_family",
      bindingValidationReason: "UNKNOWN_ASSET_FAMILY",
      placementValidationStatus: "not_validated",
      rendererHandoffReadiness: "blocked",
      reasonCode: "UNKNOWN_ASSET_FAMILY"
    });
  }

  if (rule.placementIntent !== normalizedPlacementIntent) {
    registry.__state.atlasAssetPackageId = null;
    registry.__state.assetValidationStatus = "invalid_placement_intent";
    registry.__state.bindingValidationReason = "PLACEMENT_INTENT_MISMATCH";
    registry.__state.placementValidationStatus = "not_validated";
    registry.__state.rendererHandoffReadiness = "blocked";
    registry.__state.lastFailureReason = "PLACEMENT_INTENT_MISMATCH";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      atlasAssetPackageId: null,
      assetValidationStatus: "invalid_placement_intent",
      bindingValidationReason: "PLACEMENT_INTENT_MISMATCH",
      placementValidationStatus: "not_validated",
      rendererHandoffReadiness: "blocked",
      reasonCode: "PLACEMENT_INTENT_MISMATCH"
    });
  }

  const assetPackage = rule.assetPackages?.[normalizedSelectedAssetId] ?? null;
  if (!assetPackage) {
    registry.__state.atlasAssetPackageId = null;
    registry.__state.assetValidationStatus = "invalid_asset";
    registry.__state.bindingValidationReason = "ASSET_NOT_REGISTERED";
    registry.__state.placementValidationStatus = "not_validated";
    registry.__state.rendererHandoffReadiness = "blocked";
    registry.__state.lastFailureReason = "ASSET_NOT_REGISTERED";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      atlasAssetPackageId: null,
      assetValidationStatus: "invalid_asset",
      bindingValidationReason: "ASSET_NOT_REGISTERED",
      placementValidationStatus: "not_validated",
      rendererHandoffReadiness: "blocked",
      reasonCode: "ASSET_NOT_REGISTERED"
    });
  }

  if (!assetPackage.variants.includes(normalizedAssetVariantId)) {
    registry.__state.atlasAssetPackageId = null;
    registry.__state.assetValidationStatus = "invalid_variant";
    registry.__state.bindingValidationReason = "VARIANT_NOT_REGISTERED";
    registry.__state.placementValidationStatus = "not_validated";
    registry.__state.rendererHandoffReadiness = "blocked";
    registry.__state.lastFailureReason = "VARIANT_NOT_REGISTERED";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      atlasAssetPackageId: null,
      assetValidationStatus: "invalid_variant",
      bindingValidationReason: "VARIANT_NOT_REGISTERED",
      placementValidationStatus: "not_validated",
      rendererHandoffReadiness: "blocked",
      reasonCode: "VARIANT_NOT_REGISTERED"
    });
  }

  if (!assetPackage.materialFamilyIds.includes(normalizedMaterialFamilyId)) {
    registry.__state.atlasAssetPackageId = null;
    registry.__state.assetValidationStatus = "invalid_material_family";
    registry.__state.bindingValidationReason = "MATERIAL_FAMILY_INCOMPATIBLE";
    registry.__state.placementValidationStatus = "not_validated";
    registry.__state.rendererHandoffReadiness = "blocked";
    registry.__state.lastFailureReason = "MATERIAL_FAMILY_INCOMPATIBLE";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      atlasAssetPackageId: null,
      assetValidationStatus: "invalid_material_family",
      bindingValidationReason: "MATERIAL_FAMILY_INCOMPATIBLE",
      placementValidationStatus: "not_validated",
      rendererHandoffReadiness: "blocked",
      reasonCode: "MATERIAL_FAMILY_INCOMPATIBLE"
    });
  }

  if (!assetPackage.paletteProfileIds.includes(normalizedPaletteProfileId)) {
    registry.__state.atlasAssetPackageId = null;
    registry.__state.assetValidationStatus = "invalid_palette_profile";
    registry.__state.bindingValidationReason = "PALETTE_PROFILE_INCOMPATIBLE";
    registry.__state.placementValidationStatus = "not_validated";
    registry.__state.rendererHandoffReadiness = "blocked";
    registry.__state.lastFailureReason = "PALETTE_PROFILE_INCOMPATIBLE";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      atlasAssetPackageId: null,
      assetValidationStatus: "invalid_palette_profile",
      bindingValidationReason: "PALETTE_PROFILE_INCOMPATIBLE",
      placementValidationStatus: "not_validated",
      rendererHandoffReadiness: "blocked",
      reasonCode: "PALETTE_PROFILE_INCOMPATIBLE"
    });
  }

  if (!assetPackage.lodProfileIds.includes(normalizedLodProfileId)) {
    registry.__state.atlasAssetPackageId = null;
    registry.__state.assetValidationStatus = "invalid_lod_profile";
    registry.__state.bindingValidationReason = "LOD_PROFILE_INVALID";
    registry.__state.placementValidationStatus = "not_validated";
    registry.__state.rendererHandoffReadiness = "blocked";
    registry.__state.lastFailureReason = "LOD_PROFILE_INVALID";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      atlasAssetPackageId: null,
      assetValidationStatus: "invalid_lod_profile",
      bindingValidationReason: "LOD_PROFILE_INVALID",
      placementValidationStatus: "not_validated",
      rendererHandoffReadiness: "blocked",
      reasonCode: "LOD_PROFILE_INVALID"
    });
  }

  const latitude = Number(coordinate?.latitude);
  const longitude = Number(coordinate?.longitude);
  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
    registry.__state.atlasAssetPackageId = null;
    registry.__state.assetValidationStatus = "valid";
    registry.__state.bindingValidationReason = "BINDING_VALID";
    registry.__state.placementValidationStatus = "invalid_transform";
    registry.__state.rendererHandoffReadiness = "blocked";
    registry.__state.lastFailureReason = "INVALID_PLACEMENT_TRANSFORM";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      atlasAssetPackageId: null,
      assetValidationStatus: "valid",
      bindingValidationReason: "BINDING_VALID",
      placementValidationStatus: "invalid_transform",
      rendererHandoffReadiness: "blocked",
      reasonCode: "INVALID_PLACEMENT_TRANSFORM"
    });
  }

  const atlasAssetPackageId = `ATLAS_ASSET_PACKAGE_${hashString(
    stableSerialize({
      assetFamilyId: normalizedAssetFamilyId,
      selectedAssetId: normalizedSelectedAssetId,
      assetVariantId: normalizedAssetVariantId,
      materialFamilyId: normalizedMaterialFamilyId,
      paletteProfileId: normalizedPaletteProfileId,
      lodProfileId: normalizedLodProfileId,
      placementIntent: normalizedPlacementIntent,
      coordinate: {
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6))
      }
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;

  registry.__state.atlasAssetPackageId = atlasAssetPackageId;
  registry.__state.assetValidationStatus = "valid";
  registry.__state.bindingValidationReason = "BINDING_VALID";
  registry.__state.placementValidationStatus = "valid";
  registry.__state.rendererHandoffReadiness = rule.rendererHandoffReadiness;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    atlasAssetPackageId,
    assetValidationStatus: "valid",
    bindingValidationReason: "BINDING_VALID",
    placementValidationStatus: "valid",
    rendererHandoffReadiness: rule.rendererHandoffReadiness,
    reasonCode: "RESOLVED"
  });
}
