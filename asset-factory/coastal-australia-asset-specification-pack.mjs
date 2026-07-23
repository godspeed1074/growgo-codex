import { assetRegistryStatuses, validateAssetRecord } from "./asset-registry.mjs";
import { buildStarterWorldAssetPackContext } from "./starter-world-asset-pack.mjs";

export const coastalAustraliaAssetSpecificationRequiredFields = Object.freeze([
  "assetId",
  "styleTheme",
  "componentRequirements",
  "moduleReferences",
  "variants",
  "orientationSupport",
  "placementExpectations",
  "lodRequirements",
  "mobilePerformanceRequirements",
  "metadata"
]);

export const coastalAustraliaAssetPackRequiredFields = Object.freeze([
  "packId",
  "version",
  "status",
  "assetSpecifications",
  "metadata"
]);

export const coastalAustraliaOrientationSupport = deepFreeze([
  "north",
  "south",
  "east",
  "west"
]);

export const coastalAustraliaAssetSpecificationPackDefinition = deepFreeze({
  packId: "COASTAL_AUSTRALIA_ASSET_PACK_001",
  version: "1.0.0",
  status: "validated",
  assetSpecifications: deepFreeze([
    createAssetSpecificationRecord({
      assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
      styleTheme: "coastal_australian_residential",
      componentRequirements: [
        "COASTAL_HOUSE_WALL_PANEL_001",
        "COASTAL_HOUSE_ROOF_GABLE_001",
        "COASTAL_HOUSE_DOOR_BASIC_001",
        "COASTAL_HOUSE_WINDOW_SHUTTER_001"
      ],
      moduleReferences: ["wall_shell", "roof_shell", "entry_module", "window_module"],
      variants: ["weathered_timber", "fresh_paint", "storm_prepared"],
      orientationSupport: {
        allowedOrientations: coastalAustraliaOrientationSupport,
        roadFacingSupported: true,
        preferredRoadFacingOrientation: "faceRoad"
      },
      placementExpectations: {
        placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
        preferredLocations: ["building_plot", "road_edge"],
        terrainProfile: ["grass", "dirt", "sand"]
      },
      lodRequirements: {
        profile: "mobile-default",
        lodLevels: ["lod0", "lod1", "lod2"]
      },
      mobilePerformanceRequirements: {
        storageBudget: "low",
        ramBudget: "low",
        gpuBudget: "low",
        batchingFriendly: true
      },
      metadata: {
        creatorSource: "internal",
        validationState: "validated",
        styleRules: [
          "weatherboard_or_light_render_surfaces",
          "salt-air_resilient_palette",
          "compact_modular_verandah_ready"
        ]
      }
    }),
    createAssetSpecificationRecord({
      assetId: "BUILDING_BAKERY_SMALL_001",
      styleTheme: "coastal_australian_corner_bakery",
      componentRequirements: [
        "BAKERY_WALL_PANEL_001",
        "BAKERY_ROOF_GABLE_001",
        "BAKERY_DOOR_GLASS_001",
        "BAKERY_WINDOW_DISPLAY_001",
        "BAKERY_SIGN_BOARD_001"
      ],
      moduleReferences: [
        "shopfront_shell",
        "roof_shell",
        "display_window_module",
        "signage_module"
      ],
      variants: ["morning_trade", "closed_shutters", "fresh_signage"],
      orientationSupport: {
        allowedOrientations: coastalAustraliaOrientationSupport,
        roadFacingSupported: true,
        preferredRoadFacingOrientation: "faceRoad"
      },
      placementExpectations: {
        placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
        preferredLocations: ["road_edge", "building_plot"],
        terrainProfile: ["grass", "dirt", "sand"]
      },
      lodRequirements: {
        profile: "mobile-default",
        lodLevels: ["lod0", "lod1", "lod2"]
      },
      mobilePerformanceRequirements: {
        storageBudget: "low",
        ramBudget: "low",
        gpuBudget: "low",
        batchingFriendly: true
      },
      metadata: {
        creatorSource: "internal",
        validationState: "validated",
        styleRules: [
          "painted_masonry_or_timber_shopfront",
          "warm_coastal_commercial_palette",
          "readable_signboard_at_small_scale"
        ]
      }
    }),
    createAssetSpecificationRecord({
      assetId: "BUILDING_GAS_STATION_SMALL_001",
      styleTheme: "coastal_australian_service_stop",
      componentRequirements: [
        "GAS_STATION_WALL_PANEL_001",
        "GAS_STATION_ROOF_CANOPY_001",
        "GAS_STATION_DOOR_GLASS_001",
        "GAS_STATION_WINDOW_BASIC_001",
        "GAS_STATION_PUMP_ICON_001"
      ],
      moduleReferences: [
        "service_shell",
        "forecourt_canopy",
        "entry_module",
        "service_signage_module"
      ],
      variants: ["day_service", "night_service", "reduced_canopy_signage"],
      orientationSupport: {
        allowedOrientations: coastalAustraliaOrientationSupport,
        roadFacingSupported: true,
        preferredRoadFacingOrientation: "faceRoad"
      },
      placementExpectations: {
        placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
        preferredLocations: ["road_edge"],
        terrainProfile: ["grass", "dirt", "sand"]
      },
      lodRequirements: {
        profile: "mobile-default",
        lodLevels: ["lod0", "lod1", "lod2"]
      },
      mobilePerformanceRequirements: {
        storageBudget: "low",
        ramBudget: "low",
        gpuBudget: "low",
        batchingFriendly: true
      },
      metadata: {
        creatorSource: "internal",
        validationState: "validated",
        styleRules: [
          "compact_regional_service_station_mass",
          "simple_canopy_profile",
          "coastal_uv_faded_branding_safe_defaults"
        ]
      }
    }),
    createAssetSpecificationRecord({
      assetId: "TREE_EUCALYPTUS_001",
      styleTheme: "coastal_australian_eucalyptus",
      componentRequirements: [
        "TREE_EUCALYPTUS_TRUNK_001",
        "TREE_EUCALYPTUS_CANOPY_001"
      ],
      moduleReferences: ["trunk_module", "canopy_module"],
      variants: ["windswept", "upright", "young_cluster"],
      orientationSupport: {
        allowedOrientations: coastalAustraliaOrientationSupport,
        roadFacingSupported: false,
        preferredRoadFacingOrientation: null
      },
      placementExpectations: {
        placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
        preferredLocations: ["terrain_cell", "nature_cluster"],
        terrainProfile: ["grass", "dirt", "sand"]
      },
      lodRequirements: {
        profile: "mobile-default",
        lodLevels: ["lod0", "lod1", "lod2"]
      },
      mobilePerformanceRequirements: {
        storageBudget: "low",
        ramBudget: "low",
        gpuBudget: "low",
        batchingFriendly: true
      },
      metadata: {
        creatorSource: "internal",
        validationState: "validated",
        styleRules: [
          "slender_trunk_silhouette",
          "coastal_wind_lean_supported",
          "leaf_mass_kept_readable_at_small_scale"
        ]
      }
    })
  ]),
  metadata: deepFreeze({
    creatorSource: "internal",
    validationState: "validated",
    packRole: "coastal_australia_modular_specifications",
    deterministic: true
  })
});

const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;
const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function buildCoastalAustraliaAssetSpecificationPackContext() {
  return Object.freeze(buildStarterWorldAssetPackContext());
}

export function createCoastalAustraliaAssetSpecificationPack(
  rawPack = coastalAustraliaAssetSpecificationPackDefinition,
  options = {}
) {
  return normalizeCoastalAustraliaAssetSpecificationPack(
    rawPack,
    normalizePackOptions(options)
  );
}

export function validateCoastalAustraliaAssetSpecificationPack(
  rawPack = coastalAustraliaAssetSpecificationPackDefinition,
  options = {}
) {
  try {
    const normalizedPack = normalizeCoastalAustraliaAssetSpecificationPack(
      rawPack,
      normalizePackOptions(options)
    );

    return Object.freeze({
      ok: true,
      normalizedPack,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "CoastalAustraliaAssetSpecificationPackValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedPack: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizeCoastalAustraliaAssetSpecificationPack(rawPack, options) {
  assertRequiredRegistries(options);

  const pack = asPlainObject(rawPack, "coastal australia asset specification pack");
  assertRequiredPackFields(pack);

  const packId = normalizePermanentId(pack.packId, "packId");
  const version = normalizeVersion(pack.version, "version");
  const status = normalizeStatus(pack.status, "status");
  const assetSpecifications = normalizeAssetSpecifications(
    pack.assetSpecifications,
    options
  );
  const metadata = deepFreeze(asPlainObject(pack.metadata, "metadata"));

  return deepFreeze({
    packId,
    version,
    status,
    assetSpecifications: deepFreeze(assetSpecifications),
    metadata
  });
}

function normalizeAssetSpecifications(value, options) {
  if (!Array.isArray(value)) {
    throw createSpecificationValidationError(
      "invalid_field_type",
      "assetSpecifications must be an array of specification objects."
    );
  }

  return value.map((entry, index) =>
    normalizeAssetSpecification(entry, options, `assetSpecifications[${index}]`)
  );
}

function normalizeAssetSpecification(rawSpecification, options, label) {
  const specification = asPlainObject(rawSpecification, label);
  assertRequiredSpecificationFields(specification, label);

  const assetId = normalizePermanentId(
    specification.assetId,
    `${label}.assetId`
  );
  const styleTheme = normalizeStringValue(
    specification.styleTheme,
    `${label}.styleTheme`
  );
  const componentRequirements = normalizePermanentIdArray(
    specification.componentRequirements,
    `${label}.componentRequirements`
  );
  const moduleReferences = normalizeStringArray(
    specification.moduleReferences,
    `${label}.moduleReferences`
  );
  const variants = normalizeStringArray(specification.variants, `${label}.variants`);
  const orientationSupport = normalizeOrientationSupport(
    specification.orientationSupport,
    `${label}.orientationSupport`
  );
  const placementExpectations = normalizePlacementExpectations(
    specification.placementExpectations,
    `${label}.placementExpectations`
  );
  const lodRequirements = normalizeLodRequirements(
    specification.lodRequirements,
    `${label}.lodRequirements`
  );
  const mobilePerformanceRequirements = normalizeMobilePerformanceRequirements(
    specification.mobilePerformanceRequirements,
    `${label}.mobilePerformanceRequirements`
  );
  const metadata = deepFreeze(asPlainObject(specification.metadata, `${label}.metadata`));

  validateSpecificationDependencies(
    assetId,
    componentRequirements,
    placementExpectations,
    options
  );

  return deepFreeze({
    assetId,
    styleTheme,
    componentRequirements: deepFreeze(componentRequirements),
    moduleReferences: deepFreeze(moduleReferences),
    variants: deepFreeze(variants),
    orientationSupport,
    placementExpectations,
    lodRequirements,
    mobilePerformanceRequirements,
    metadata
  });
}

function validateSpecificationDependencies(
  assetId,
  componentRequirements,
  placementExpectations,
  options
) {
  const asset = options.assetRegistry.findAssetById(assetId);
  if (!asset) {
    throw createSpecificationValidationError(
      "missing_asset_reference",
      `Specification asset ${assetId} is not registered.`
    );
  }

  if (
    typeof options.assetRegistry.isAssetAvailable === "function" &&
    !options.assetRegistry.isAssetAvailable(assetId)
  ) {
    throw createSpecificationValidationError(
      "unavailable_asset_reference",
      `Specification asset ${assetId} is not approved.`
    );
  }

  const assetValidation = validateAssetRecord(asset);
  if (!assetValidation.ok) {
    throw createSpecificationValidationError(
      "invalid_asset_record",
      `Specification asset ${assetId} failed validation with ${assetValidation.errorCode}.`
    );
  }

  const manifest = options.manifestRegistry.findManifestByAssetId(assetId);
  if (!manifest) {
    throw createSpecificationValidationError(
      "missing_manifest_reference",
      `Specification asset ${assetId} is missing a manifest.`
    );
  }

  if (
    typeof options.manifestRegistry.isManifestAvailable === "function" &&
    !options.manifestRegistry.isManifestAvailable(assetId)
  ) {
    throw createSpecificationValidationError(
      "unavailable_manifest_reference",
      `Specification manifest ${assetId} is not approved.`
    );
  }

  const recipe = options.recipeRegistry.findRecipeById(manifest.recipeId);
  if (!recipe) {
    throw createSpecificationValidationError(
      "missing_recipe_reference",
      `Specification manifest ${assetId} references a missing recipe ${manifest.recipeId}.`
    );
  }

  if (
    typeof options.recipeRegistry.isRecipeAvailable === "function" &&
    !options.recipeRegistry.isRecipeAvailable(manifest.recipeId)
  ) {
    throw createSpecificationValidationError(
      "unavailable_recipe_reference",
      `Specification recipe ${manifest.recipeId} is not approved.`
    );
  }

  if (componentRequirements.length !== manifest.componentReferences.length) {
    throw createSpecificationValidationError(
      "component_requirement_mismatch",
      `Specification asset ${assetId} must declare the full manifest component set.`
    );
  }

  for (const componentId of componentRequirements) {
    if (!manifest.componentReferences.includes(componentId)) {
      throw createSpecificationValidationError(
        "component_requirement_mismatch",
        `Specification asset ${assetId} declared component ${componentId} outside the manifest component set.`
      );
    }

    if (!options.componentLibrary.findComponentById(componentId)) {
      throw createSpecificationValidationError(
        "missing_component_reference",
        `Specification component ${componentId} is not registered.`
      );
    }

    if (
      typeof options.componentLibrary.isComponentAvailable === "function" &&
      !options.componentLibrary.isComponentAvailable(componentId)
    ) {
      throw createSpecificationValidationError(
        "unavailable_component_reference",
        `Specification component ${componentId} is not approved.`
      );
    }
  }

  const placementRule = options.placementRuleRegistry.findPlacementRuleById(
    placementExpectations.placementRuleId
  );
  if (!placementRule) {
    throw createSpecificationValidationError(
      "missing_placement_rule",
      `Specification placement rule ${placementExpectations.placementRuleId} is not registered.`
    );
  }

  if (!placementRule.compatibilityRules.allowedAssetIds.includes(assetId)) {
    throw createSpecificationValidationError(
      "asset_not_allowed_by_placement_rule",
      `Specification asset ${assetId} is not approved by placement rule ${placementExpectations.placementRuleId}.`
    );
  }
}

function assertRequiredRegistries(options) {
  const requiredChecks = [
    ["assetRegistry", "findAssetById", "asset_registry_unavailable"],
    [
      "manifestRegistry",
      "findManifestByAssetId",
      "manifest_registry_unavailable"
    ],
    ["recipeRegistry", "findRecipeById", "recipe_registry_unavailable"],
    ["componentLibrary", "findComponentById", "component_library_unavailable"],
    [
      "placementRuleRegistry",
      "findPlacementRuleById",
      "placement_rule_registry_unavailable"
    ]
  ];

  for (const [key, methodName, errorCode] of requiredChecks) {
    if (!options[key] || typeof options[key][methodName] !== "function") {
      throw createSpecificationValidationError(
        errorCode,
        `Coastal Australia specification pack requires available ${key}.`
      );
    }
  }
}

function assertRequiredPackFields(pack) {
  for (const fieldName of coastalAustraliaAssetPackRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(pack, fieldName)) {
      throw createSpecificationValidationError(
        "missing_required_field",
        `Coastal Australia asset specification pack is missing required field ${fieldName}.`
      );
    }
  }
}

function assertRequiredSpecificationFields(specification, label) {
  for (const fieldName of coastalAustraliaAssetSpecificationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(specification, fieldName)) {
      throw createSpecificationValidationError(
        "missing_required_field",
        `${label} is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePackOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return Object.freeze({
      assetRegistry: null,
      manifestRegistry: null,
      recipeRegistry: null,
      componentLibrary: null,
      placementRuleRegistry: null
    });
  }

  return Object.freeze({
    assetRegistry:
      options.assetRegistry && typeof options.assetRegistry === "object"
        ? options.assetRegistry
        : null,
    manifestRegistry:
      options.manifestRegistry && typeof options.manifestRegistry === "object"
        ? options.manifestRegistry
        : null,
    recipeRegistry:
      options.recipeRegistry && typeof options.recipeRegistry === "object"
        ? options.recipeRegistry
        : null,
    componentLibrary:
      options.componentLibrary && typeof options.componentLibrary === "object"
        ? options.componentLibrary
        : null,
    placementRuleRegistry:
      options.placementRuleRegistry &&
      typeof options.placementRuleRegistry === "object"
        ? options.placementRuleRegistry
        : null
  });
}

function normalizeOrientationSupport(value, label) {
  const orientationSupport = asPlainObject(value, label);
  const allowedOrientations = normalizeStringArray(
    orientationSupport.allowedOrientations,
    `${label}.allowedOrientations`
  );

  for (const orientation of allowedOrientations) {
    if (!coastalAustraliaOrientationSupport.includes(orientation)) {
      throw createSpecificationValidationError(
        "invalid_orientation",
        `${label}.allowedOrientations contains unsupported orientation ${orientation}.`
      );
    }
  }

  return deepFreeze({
    allowedOrientations: deepFreeze(allowedOrientations),
    roadFacingSupported: normalizeBoolean(
      orientationSupport.roadFacingSupported,
      `${label}.roadFacingSupported`
    ),
    preferredRoadFacingOrientation:
      orientationSupport.preferredRoadFacingOrientation === null
        ? null
        : normalizeStringValue(
            orientationSupport.preferredRoadFacingOrientation,
            `${label}.preferredRoadFacingOrientation`
          )
  });
}

function normalizePlacementExpectations(value, label) {
  const placementExpectations = asPlainObject(value, label);

  return deepFreeze({
    placementRuleId: normalizePermanentId(
      placementExpectations.placementRuleId,
      `${label}.placementRuleId`
    ),
    preferredLocations: deepFreeze(
      normalizeStringArray(
        placementExpectations.preferredLocations,
        `${label}.preferredLocations`
      )
    ),
    terrainProfile: deepFreeze(
      normalizeStringArray(
        placementExpectations.terrainProfile,
        `${label}.terrainProfile`
      )
    )
  });
}

function normalizeLodRequirements(value, label) {
  const lodRequirements = asPlainObject(value, label);

  return deepFreeze({
    profile: normalizeStringValue(lodRequirements.profile, `${label}.profile`),
    lodLevels: deepFreeze(
      normalizeStringArray(lodRequirements.lodLevels, `${label}.lodLevels`)
    )
  });
}

function normalizeMobilePerformanceRequirements(value, label) {
  const requirements = asPlainObject(value, label);

  return deepFreeze({
    storageBudget: normalizeStringValue(
      requirements.storageBudget,
      `${label}.storageBudget`
    ),
    ramBudget: normalizeStringValue(requirements.ramBudget, `${label}.ramBudget`),
    gpuBudget: normalizeStringValue(requirements.gpuBudget, `${label}.gpuBudget`),
    batchingFriendly: normalizeBoolean(
      requirements.batchingFriendly,
      `${label}.batchingFriendly`
    )
  });
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createSpecificationValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createSpecificationValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of non-empty strings.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createSpecificationValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizeVersion(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!versionPattern.test(normalized)) {
    throw createSpecificationValidationError(
      "invalid_version",
      `Field ${fieldName} must use the approved Asset Factory version format.`
    );
  }

  return normalized;
}

function normalizeStatus(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!assetRegistryStatuses.includes(normalized)) {
    throw createSpecificationValidationError(
      "invalid_status",
      `Field ${fieldName} must use an approved Asset Factory status.`
    );
  }

  return normalized;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createSpecificationValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean value.`
    );
  }

  return value;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createSpecificationValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createSpecificationValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createSpecificationValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createAssetSpecificationRecord(specification) {
  return deepFreeze(specification);
}

function createSpecificationValidationError(code, message) {
  const error = new Error(message);
  error.name = "CoastalAustraliaAssetSpecificationPackValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }

  return Object.freeze(value);
}
