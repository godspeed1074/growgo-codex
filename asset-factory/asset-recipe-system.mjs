import { assetRegistryStatuses } from "./asset-registry.mjs";

export const assetRecipeRequiredFields = Object.freeze([
  "recipeId",
  "assetType",
  "version",
  "status",
  "components",
  "optionalComponents",
  "metadata",
  "generationRules"
]);

const recipeIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const dependencyIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;

export function createAssetRecipeRegistry(initialRecipes = [], options = {}) {
  const recipeMap = new Map();
  const normalizedOptions = normalizeRecipeSystemOptions(options);

  for (const recipe of initialRecipes) {
    addRecipe(recipe);
  }

  return Object.freeze({
    addRecipe,
    hasRecipe(recipeId) {
      return recipeMap.has(normalizeRecipeIdInput(recipeId));
    },
    findRecipeById(recipeId) {
      return recipeMap.get(normalizeRecipeIdInput(recipeId)) ?? null;
    },
    getRecipeComponents(recipeId) {
      const recipe = recipeMap.get(normalizeRecipeIdInput(recipeId));
      return recipe
        ? Object.freeze({
            required: recipe.components,
            optional: recipe.optionalComponents
          })
        : null;
    },
    getRecipeGenerationRules(recipeId) {
      const recipe = recipeMap.get(normalizeRecipeIdInput(recipeId));
      return recipe ? recipe.generationRules : null;
    },
    isRecipeAvailable(recipeId) {
      const recipe = recipeMap.get(normalizeRecipeIdInput(recipeId));
      return recipe ? recipe.status === "validated" : false;
    },
    listRecipes() {
      return Array.from(recipeMap.values());
    },
    listRecipeIds() {
      return Array.from(recipeMap.keys());
    },
    size() {
      return recipeMap.size;
    }
  });

  function addRecipe(rawRecipe) {
    const normalizedRecipe = normalizeRecipeRecord(rawRecipe, normalizedOptions);
    if (recipeMap.has(normalizedRecipe.recipeId)) {
      throw createAssetRecipeValidationError(
        "duplicate_recipe_id",
        `Recipe ID ${normalizedRecipe.recipeId} already exists in the recipe registry.`
      );
    }

    recipeMap.set(normalizedRecipe.recipeId, normalizedRecipe);
    return normalizedRecipe;
  }
}

export function validateAssetRecipeRecord(rawRecipe, options = {}) {
  try {
    const normalizedRecipe = normalizeRecipeRecord(
      rawRecipe,
      normalizeRecipeSystemOptions(options)
    );

    return Object.freeze({
      ok: true,
      normalizedRecipe,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "AssetRecipeValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedRecipe: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizeRecipeRecord(rawRecipe, options) {
  const recipe = asPlainObject(rawRecipe, "recipe");
  assertRequiredFields(recipe);

  const recipeId = normalizeRecipeIdInput(recipe.recipeId);
  if (!recipeIdPattern.test(recipeId)) {
    throw createAssetRecipeValidationError(
      "invalid_recipe_id",
      `Recipe ID ${recipeId} must use the permanent uppercase Asset Factory recipe ID format.`
    );
  }

  const assetType = normalizeStringValue(recipe.assetType, "assetType");
  const version = normalizeStringValue(recipe.version, "version");
  if (!versionPattern.test(version)) {
    throw createAssetRecipeValidationError(
      "invalid_version",
      `Recipe version ${version} must use the approved Asset Factory version format.`
    );
  }

  const status = normalizeStringValue(recipe.status, "status");
  if (!assetRegistryStatuses.includes(status)) {
    throw createAssetRecipeValidationError(
      "invalid_status",
      `Recipe status ${status} is not part of the approved Asset Factory status set.`
    );
  }

  const components = normalizeDependencyArray(recipe.components, "components");
  const optionalComponents = normalizeDependencyArray(
    recipe.optionalComponents,
    "optionalComponents"
  );
  const metadata = deepFreeze(asPlainObject(recipe.metadata, "metadata"));
  const generationRules = deepFreeze(
    asPlainObject(recipe.generationRules, "generationRules")
  );

  validateDependencies(components, options, "components");
  validateDependencies(optionalComponents, options, "optionalComponents");

  return deepFreeze({
    recipeId,
    assetType,
    version,
    status,
    components: deepFreeze(components),
    optionalComponents: deepFreeze(optionalComponents),
    metadata,
    generationRules
  });
}

function validateDependencies(dependencies, options, fieldName) {
  for (const dependencyId of dependencies) {
    if (!dependencyIdPattern.test(dependencyId)) {
      throw createAssetRecipeValidationError(
        "invalid_dependency_id",
        `Dependency ${dependencyId} in ${fieldName} must use the approved permanent ID format.`
      );
    }

    const dependencyResolution = resolveDependencyAvailability(
      dependencyId,
      options
    );

    if (dependencyResolution === "missing") {
      throw createAssetRecipeValidationError(
        "missing_dependency",
        `Dependency ${dependencyId} in ${fieldName} is not registered in the available Asset Factory sources.`
      );
    }

    if (dependencyResolution === "unavailable") {
      throw createAssetRecipeValidationError(
        "unavailable_dependency",
        `Dependency ${dependencyId} in ${fieldName} is registered but not currently available for validated recipe use.`
      );
    }
  }
}

function resolveDependencyAvailability(dependencyId, options) {
  const assetRegistry = options.assetRegistry;
  const componentLibrary = options.componentLibrary;

  if (componentLibrary && typeof componentLibrary.hasComponent === "function") {
    if (componentLibrary.hasComponent(dependencyId)) {
      if (
        typeof componentLibrary.isComponentAvailable === "function" &&
        !componentLibrary.isComponentAvailable(dependencyId)
      ) {
        return "unavailable";
      }

      return "available";
    }
  }

  if (assetRegistry && typeof assetRegistry.hasAsset === "function") {
    if (assetRegistry.hasAsset(dependencyId)) {
      if (
        typeof assetRegistry.isAssetAvailable === "function" &&
        !assetRegistry.isAssetAvailable(dependencyId)
      ) {
        return "unavailable";
      }

      return "available";
    }
  }

  return options.skipDependencyValidation === true ? "available" : "missing";
}

function assertRequiredFields(recipe) {
  for (const fieldName of assetRecipeRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(recipe, fieldName)) {
      throw createAssetRecipeValidationError(
        "missing_required_field",
        `Recipe record is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeRecipeSystemOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return Object.freeze({
      assetRegistry: null,
      componentLibrary: null,
      skipDependencyValidation: false
    });
  }

  return Object.freeze({
    assetRegistry:
      options.assetRegistry && typeof options.assetRegistry === "object"
        ? options.assetRegistry
        : null,
    componentLibrary:
      options.componentLibrary && typeof options.componentLibrary === "object"
        ? options.componentLibrary
        : null,
    skipDependencyValidation: options.skipDependencyValidation === true
  });
}

function normalizeRecipeIdInput(value) {
  return normalizeStringValue(value, "recipeId").toUpperCase();
}

function normalizeDependencyArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createAssetRecipeValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of dependency ID strings.`
    );
  }

  return value.map((entry, index) => {
    try {
      return normalizeStringValue(entry, `${fieldName}[${index}]`).toUpperCase();
    } catch (error) {
      if (error?.name !== "AssetRecipeValidationError") {
        throw error;
      }

      throw createAssetRecipeValidationError(
        error.code,
        `Field ${fieldName} contains an invalid dependency at index ${index}.`
      );
    }
  });
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createAssetRecipeValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createAssetRecipeValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createAssetRecipeValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createAssetRecipeValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetRecipeValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }

  return Object.freeze(value);
}
