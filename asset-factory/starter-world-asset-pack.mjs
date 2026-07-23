import {
  assetRegistryStatuses,
  validateAssetRecord
} from "./asset-registry.mjs";
import { buildStarterAssetFactoryLayers } from "./starter-asset-manifest-pack.mjs";

export const starterWorldAssetPackRequiredFields = Object.freeze([
  "packId",
  "version",
  "status",
  "assetFamilyGroups",
  "metadata"
]);

export const starterWorldAssetPackDefinition = deepFreeze({
  packId: "STARTER_WORLD_ASSET_PACK_001",
  version: "1.0.0",
  status: "validated",
  assetFamilyGroups: deepFreeze({
    residential: deepFreeze([
      "BUILDING_HOUSE_SMALL_COASTAL_001",
      "BUILDING_HOUSE_WEATHERBOARD_001",
      "BUILDING_HOUSE_SUBURBAN_001"
    ]),
    commercial: deepFreeze([
      "BUILDING_BAKERY_SMALL_001",
      "BUILDING_SHOP_GENERAL_001",
      "BUILDING_GAS_STATION_SMALL_001"
    ]),
    infrastructure: deepFreeze([
      "ROAD_STRAIGHT_SMALL_001",
      "ROAD_CURVE_SMALL_001",
      "ROAD_INTERSECTION_SMALL_001",
      "FOOTPATH_SMALL_001"
    ]),
    nature: deepFreeze([
      "TREE_EUCALYPTUS_001",
      "TREE_NATIVE_SMALL_001",
      "BUSH_NATIVE_001",
      "ROCK_COASTAL_001",
      "GRASS_PATCH_001"
    ]),
    decoration: deepFreeze([
      "SIGN_GENERIC_001",
      "FENCE_WOOD_001",
      "LAMP_POST_BASIC_001",
      "BENCH_PARK_001"
    ])
  }),
  metadata: deepFreeze({
    creatorSource: "internal",
    validationState: "validated",
    packRole: "starter_world_catalogue",
    deterministic: true
  })
});

const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;

export function buildStarterWorldAssetPackContext() {
  return Object.freeze(buildStarterAssetFactoryLayers());
}

export function createStarterWorldAssetPack(
  rawPack = starterWorldAssetPackDefinition,
  options = {}
) {
  return normalizeStarterWorldAssetPack(rawPack, normalizePackOptions(options));
}

export function validateStarterWorldAssetPack(
  rawPack = starterWorldAssetPackDefinition,
  options = {}
) {
  try {
    const normalizedPack = normalizeStarterWorldAssetPack(
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
    if (error?.name !== "StarterWorldAssetPackValidationError") {
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

function normalizeStarterWorldAssetPack(rawPack, options) {
  assertRequiredRegistries(options);

  const pack = asPlainObject(rawPack, "starter world asset pack");
  assertRequiredFields(pack);

  const packId = normalizeStringValue(pack.packId, "packId");
  const version = normalizeVersion(pack.version, "version");
  const status = normalizeStatus(pack.status, "status");
  const assetFamilyGroups = normalizeAssetFamilyGroups(pack.assetFamilyGroups);
  const metadata = deepFreeze(asPlainObject(pack.metadata, "metadata"));

  validateWorldPackDependencies(assetFamilyGroups, options);

  return deepFreeze({
    packId,
    version,
    status,
    assetFamilyGroups,
    metadata
  });
}

function validateWorldPackDependencies(assetFamilyGroups, options) {
  for (const assetIds of Object.values(assetFamilyGroups)) {
    for (const assetId of assetIds) {
      const asset = options.assetRegistry.findAssetById(assetId);
      if (!asset) {
        throw createWorldPackValidationError(
          "missing_asset_reference",
          `World pack asset ${assetId} is not registered.`
        );
      }

      if (
        typeof options.assetRegistry.isAssetAvailable === "function" &&
        !options.assetRegistry.isAssetAvailable(assetId)
      ) {
        throw createWorldPackValidationError(
          "unavailable_asset_reference",
          `World pack asset ${assetId} is not approved.`
        );
      }

      const assetValidation = validateAssetRecord(asset);
      if (!assetValidation.ok) {
        throw createWorldPackValidationError(
          "invalid_asset_record",
          `World pack asset ${assetId} failed validation with ${assetValidation.errorCode}.`
        );
      }

      const manifest = options.manifestRegistry.findManifestByAssetId(assetId);
      if (!manifest) {
        throw createWorldPackValidationError(
          "missing_manifest_reference",
          `World pack asset ${assetId} is missing a manifest.`
        );
      }

      if (
        typeof options.manifestRegistry.isManifestAvailable === "function" &&
        !options.manifestRegistry.isManifestAvailable(assetId)
      ) {
        throw createWorldPackValidationError(
          "unavailable_manifest_reference",
          `World pack manifest ${assetId} is not approved.`
        );
      }

      const recipe = options.recipeRegistry.findRecipeById(manifest.recipeId);
      if (!recipe) {
        throw createWorldPackValidationError(
          "missing_recipe_reference",
          `World pack manifest ${assetId} references a missing recipe ${manifest.recipeId}.`
        );
      }

      if (
        typeof options.recipeRegistry.isRecipeAvailable === "function" &&
        !options.recipeRegistry.isRecipeAvailable(manifest.recipeId)
      ) {
        throw createWorldPackValidationError(
          "unavailable_recipe_reference",
          `World pack recipe ${manifest.recipeId} is not approved.`
        );
      }

      for (const componentId of manifest.componentReferences) {
        if (!options.componentLibrary.findComponentById(componentId)) {
          throw createWorldPackValidationError(
            "missing_component_reference",
            `World pack asset ${assetId} references missing component ${componentId}.`
          );
        }

        if (
          typeof options.componentLibrary.isComponentAvailable === "function" &&
          !options.componentLibrary.isComponentAvailable(componentId)
        ) {
          throw createWorldPackValidationError(
            "unavailable_component_reference",
            `World pack component ${componentId} is not approved.`
          );
        }
      }

      const matchingPlacementRules = options.placementRuleRegistry
        .listPlacementRules()
        .filter(
          (rule) =>
            rule.assetCategory === asset.category &&
            rule.compatibilityRules.allowedAssetIds.includes(assetId)
        );

      if (matchingPlacementRules.length === 0) {
        throw createWorldPackValidationError(
          "missing_placement_rule",
          `World pack asset ${assetId} does not have an approved placement rule.`
        );
      }
    }
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
      "listPlacementRules",
      "placement_rule_registry_unavailable"
    ]
  ];

  for (const [key, methodName, errorCode] of requiredChecks) {
    if (!options[key] || typeof options[key][methodName] !== "function") {
      throw createWorldPackValidationError(
        errorCode,
        `Starter world asset pack requires available ${key}.`
      );
    }
  }
}

function assertRequiredFields(pack) {
  for (const fieldName of starterWorldAssetPackRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(pack, fieldName)) {
      throw createWorldPackValidationError(
        "missing_required_field",
        `Starter world asset pack is missing required field ${fieldName}.`
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

function normalizeAssetFamilyGroups(value) {
  const groups = asPlainObject(value, "assetFamilyGroups");
  const expectedGroups = [
    "residential",
    "commercial",
    "infrastructure",
    "nature",
    "decoration"
  ];

  const normalizedGroups = {};

  for (const groupName of expectedGroups) {
    if (!Object.prototype.hasOwnProperty.call(groups, groupName)) {
      throw createWorldPackValidationError(
        "missing_required_field",
        `Starter world asset pack is missing asset family group ${groupName}.`
      );
    }

    normalizedGroups[groupName] = deepFreeze(
      normalizeStringArray(groups[groupName], `assetFamilyGroups.${groupName}`)
    );
  }

  return deepFreeze(normalizedGroups);
}

function normalizeVersion(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!versionPattern.test(normalized)) {
    throw createWorldPackValidationError(
      "invalid_version",
      `Field ${fieldName} must use the approved Asset Factory version format.`
    );
  }

  return normalized;
}

function normalizeStatus(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!assetRegistryStatuses.includes(normalized)) {
    throw createWorldPackValidationError(
      "invalid_status",
      `Field ${fieldName} must use an approved Asset Factory status.`
    );
  }

  return normalized;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createWorldPackValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of non-empty strings.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createWorldPackValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createWorldPackValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createWorldPackValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createWorldPackValidationError(code, message) {
  const error = new Error(message);
  error.name = "StarterWorldAssetPackValidationError";
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
