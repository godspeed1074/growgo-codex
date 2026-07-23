import {
  assetFactoryCategories,
  assetRegistryStatuses
} from "./asset-registry.mjs";

export const assetManifestRequiredFields = Object.freeze([
  "assetId",
  "category",
  "version",
  "status",
  "recipeId",
  "componentReferences",
  "metadata",
  "tags",
  "generationRules"
]);

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;

export function createAssetManifestRegistry(initialManifests = [], options = {}) {
  const manifestMap = new Map();
  const normalizedOptions = normalizeManifestOptions(options);

  for (const manifest of initialManifests) {
    addManifest(manifest);
  }

  return Object.freeze({
    addManifest,
    hasManifest(assetId) {
      return manifestMap.has(normalizePermanentId(assetId, "assetId"));
    },
    findManifestByAssetId(assetId) {
      return manifestMap.get(normalizePermanentId(assetId, "assetId")) ?? null;
    },
    getManifestRecipeReference(assetId) {
      const manifest = manifestMap.get(normalizePermanentId(assetId, "assetId"));
      return manifest ? manifest.recipeId : null;
    },
    getManifestComponents(assetId) {
      const manifest = manifestMap.get(normalizePermanentId(assetId, "assetId"));
      return manifest ? manifest.componentReferences : null;
    },
    getManifestGenerationRules(assetId) {
      const manifest = manifestMap.get(normalizePermanentId(assetId, "assetId"));
      return manifest ? manifest.generationRules : null;
    },
    isManifestAvailable(assetId) {
      const manifest = manifestMap.get(normalizePermanentId(assetId, "assetId"));
      return manifest ? manifest.status === "validated" : false;
    },
    listManifests() {
      return Array.from(manifestMap.values());
    },
    listManifestIds() {
      return Array.from(manifestMap.keys());
    },
    size() {
      return manifestMap.size;
    }
  });

  function addManifest(rawManifest) {
    const normalizedManifest = normalizeAssetManifest(rawManifest, normalizedOptions);

    if (manifestMap.has(normalizedManifest.assetId)) {
      throw createAssetManifestValidationError(
        "duplicate_asset_id",
        `Asset manifest ${normalizedManifest.assetId} already exists in the manifest registry.`
      );
    }

    manifestMap.set(normalizedManifest.assetId, normalizedManifest);
    return normalizedManifest;
  }
}

export function validateAssetManifestRecord(rawManifest, options = {}) {
  try {
    const normalizedManifest = normalizeAssetManifest(
      rawManifest,
      normalizeManifestOptions(options)
    );

    return Object.freeze({
      ok: true,
      normalizedManifest,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "AssetManifestValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedManifest: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizeAssetManifest(rawManifest, options) {
  const manifest = asPlainObject(rawManifest, "manifest");
  assertRequiredFields(manifest);

  const assetId = normalizePermanentId(manifest.assetId, "assetId");
  const recipeId = normalizePermanentId(manifest.recipeId, "recipeId");
  const category = normalizeStringValue(manifest.category, "category");
  const version = normalizeVersion(manifest.version, "version");
  const status = normalizeStatus(manifest.status, "status");
  const componentReferences = normalizeStringArray(
    manifest.componentReferences,
    "componentReferences",
    true
  );
  const tags = normalizeStringArray(manifest.tags, "tags");
  const metadata = deepFreeze(asPlainObject(manifest.metadata, "metadata"));
  const generationRules = deepFreeze(
    asPlainObject(manifest.generationRules, "generationRules")
  );

  if (!assetFactoryCategories.includes(category)) {
    throw createAssetManifestValidationError(
      "invalid_category",
      `Asset manifest category ${category} is not part of the approved Asset Factory categories.`
    );
  }

  validateReferencedRecipe(recipeId, options.recipeRegistry);
  validateReferencedComponents(componentReferences, options.componentLibrary);

  return deepFreeze({
    assetId,
    category,
    version,
    status,
    recipeId,
    componentReferences: deepFreeze(componentReferences),
    metadata,
    tags: deepFreeze(tags),
    generationRules
  });
}

function validateReferencedRecipe(recipeId, recipeRegistry) {
  if (!recipeRegistry || typeof recipeRegistry.hasRecipe !== "function") {
    throw createAssetManifestValidationError(
      "recipe_registry_unavailable",
      "Asset manifest validation requires an available recipe registry."
    );
  }

  if (!recipeRegistry.hasRecipe(recipeId)) {
    throw createAssetManifestValidationError(
      "missing_recipe_reference",
      `Recipe ${recipeId} is not registered in the recipe system.`
    );
  }

  if (
    typeof recipeRegistry.isRecipeAvailable === "function" &&
    !recipeRegistry.isRecipeAvailable(recipeId)
  ) {
    throw createAssetManifestValidationError(
      "unavailable_recipe_reference",
      `Recipe ${recipeId} is registered but not approved for validated manifest use.`
    );
  }
}

function validateReferencedComponents(componentReferences, componentLibrary) {
  if (!componentLibrary || typeof componentLibrary.hasComponent !== "function") {
    throw createAssetManifestValidationError(
      "component_library_unavailable",
      "Asset manifest validation requires an available component library."
    );
  }

  for (const componentId of componentReferences) {
    if (!componentLibrary.hasComponent(componentId)) {
      throw createAssetManifestValidationError(
        "missing_component_reference",
        `Component ${componentId} is not registered in the component library.`
      );
    }

    if (
      typeof componentLibrary.isComponentAvailable === "function" &&
      !componentLibrary.isComponentAvailable(componentId)
    ) {
      throw createAssetManifestValidationError(
        "unavailable_component_reference",
        `Component ${componentId} is registered but not approved for validated manifest use.`
      );
    }
  }
}

function assertRequiredFields(manifest) {
  for (const fieldName of assetManifestRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(manifest, fieldName)) {
      throw createAssetManifestValidationError(
        "missing_required_field",
        `Asset manifest is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeManifestOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return Object.freeze({
      recipeRegistry: null,
      componentLibrary: null
    });
  }

  return Object.freeze({
    recipeRegistry:
      options.recipeRegistry && typeof options.recipeRegistry === "object"
        ? options.recipeRegistry
        : null,
    componentLibrary:
      options.componentLibrary && typeof options.componentLibrary === "object"
        ? options.componentLibrary
        : null
  });
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createAssetManifestValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizeVersion(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!versionPattern.test(normalized)) {
    throw createAssetManifestValidationError(
      "invalid_version",
      `Field ${fieldName} must use the approved Asset Factory version format.`
    );
  }

  return normalized;
}

function normalizeStatus(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!assetRegistryStatuses.includes(normalized)) {
    throw createAssetManifestValidationError(
      "invalid_status",
      `Field ${fieldName} must use an approved Asset Factory status.`
    );
  }

  return normalized;
}

function normalizeStringArray(value, fieldName, enforceIdFormat = false) {
  if (!Array.isArray(value)) {
    throw createAssetManifestValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of non-empty strings.`
    );
  }

  return value.map((entry, index) => {
    const normalized = normalizeStringValue(entry, `${fieldName}[${index}]`);
    const finalValue = enforceIdFormat ? normalized.toUpperCase() : normalized;

    if (enforceIdFormat && !permanentIdPattern.test(finalValue)) {
      throw createAssetManifestValidationError(
        "invalid_identifier",
        `Field ${fieldName}[${index}] must use the approved permanent uppercase Asset Factory ID format.`
      );
    }

    return finalValue;
  });
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createAssetManifestValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createAssetManifestValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createAssetManifestValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createAssetManifestValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetManifestValidationError";
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
