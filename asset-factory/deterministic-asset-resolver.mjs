import { assetFactoryCategories } from "./asset-registry.mjs";

export const deterministicAssetResolverRequiredFields = Object.freeze([
  "locationId",
  "coordinates",
  "seed",
  "availableAssetReferences",
  "resolverRules"
]);

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function createDeterministicAssetResolver(options = {}) {
  const normalizedOptions = normalizeResolverOptions(options);

  return Object.freeze({
    resolve(input) {
      return resolveDeterministicAssetSelection(input, normalizedOptions);
    },
    validateInput(input) {
      return validateDeterministicAssetResolverInput(input, normalizedOptions);
    }
  });
}

export function resolveDeterministicAssetSelection(input, options = {}) {
  const normalizedOptions = normalizeResolverOptions(options);
  const inputValidation = validateDeterministicAssetResolverInput(
    input,
    normalizedOptions
  );

  if (!inputValidation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: inputValidation.errorCode,
      message: inputValidation.message,
      selectedAsset: null,
      selectedManifest: null,
      selectedRecipeReference: null,
      deterministicVariant: null
    });
  }

  const normalizedInput = inputValidation.normalizedInput;
  const candidates = collectResolverCandidates(normalizedInput, normalizedOptions);

  if (candidates.length === 0) {
    return Object.freeze({
      ok: false,
      errorCode: "no_matching_assets",
      message:
        "No approved assets matched the deterministic resolver input and rules.",
      selectedAsset: null,
      selectedManifest: null,
      selectedRecipeReference: null,
      deterministicVariant: null
    });
  }

  const hashInput = [
    normalizedInput.locationId,
    `${normalizedInput.coordinates.x},${normalizedInput.coordinates.y}`,
    normalizedInput.seed,
    normalizedInput.assetCategory ?? "",
    normalizedInput.assetType ?? "",
    candidates.map((candidate) => candidate.assetId).join("|"),
    normalizedInput.resolverRules.variantPolicy,
    String(normalizedInput.resolverRules.variantOffset)
  ].join("::");

  const deterministicHash = stableHash(hashInput);
  const selectedIndex =
    (deterministicHash + normalizedInput.resolverRules.variantOffset) %
    candidates.length;
  const selectedCandidate = candidates[selectedIndex];

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    selectedAsset: selectedCandidate.asset,
    selectedManifest: selectedCandidate.manifest,
    selectedRecipeReference: selectedCandidate.manifest.recipeId,
    deterministicVariant: Object.freeze({
      hashInput,
      deterministicHash,
      selectedIndex,
      candidateCount: candidates.length,
      selectedAssetId: selectedCandidate.assetId,
      variantPolicy: normalizedInput.resolverRules.variantPolicy
    })
  });
}

export function validateDeterministicAssetResolverInput(input, options = {}) {
  try {
    const normalizedInput = normalizeResolverInput(
      input,
      normalizeResolverOptions(options)
    );

    return Object.freeze({
      ok: true,
      normalizedInput,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "DeterministicAssetResolverValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedInput: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizeResolverInput(rawInput, options) {
  const input = asPlainObject(rawInput, "resolver input");
  assertRequiredFields(input);

  const locationId = normalizeStringValue(input.locationId, "locationId");
  const coordinates = normalizeCoordinates(input.coordinates);
  const seed = normalizeStringValue(input.seed, "seed");
  const availableAssetReferences = normalizePermanentIdArray(
    input.availableAssetReferences,
    "availableAssetReferences"
  );
  const assetCategory = normalizeOptionalCategory(input.assetCategory);
  const assetType = normalizeOptionalStringValue(input.assetType, "assetType");
  const resolverRules = normalizeResolverRules(input.resolverRules);

  if (!assetCategory && !assetType) {
    throw createResolverValidationError(
      "missing_selection_target",
      "Resolver input must provide assetCategory, assetType, or both."
    );
  }

  validateAvailableAssetReferences(availableAssetReferences, options);

  return Object.freeze({
    locationId,
    coordinates,
    seed,
    assetCategory,
    assetType,
    availableAssetReferences: deepFreeze(availableAssetReferences),
    resolverRules
  });
}

function validateAvailableAssetReferences(assetReferences, options) {
  const { assetRegistry, manifestRegistry } = options;

  if (!assetRegistry || typeof assetRegistry.findAssetById !== "function") {
    throw createResolverValidationError(
      "asset_registry_unavailable",
      "Deterministic resolver validation requires an available asset registry."
    );
  }

  if (
    !manifestRegistry ||
    typeof manifestRegistry.findManifestByAssetId !== "function"
  ) {
    throw createResolverValidationError(
      "manifest_registry_unavailable",
      "Deterministic resolver validation requires an available manifest registry."
    );
  }

  for (const assetId of assetReferences) {
    const asset = assetRegistry.findAssetById(assetId);
    if (!asset) {
      throw createResolverValidationError(
        "missing_asset_reference",
        `Resolver asset reference ${assetId} is not present in the asset registry.`
      );
    }

    if (
      typeof assetRegistry.isAssetAvailable === "function" &&
      !assetRegistry.isAssetAvailable(assetId)
    ) {
      throw createResolverValidationError(
        "unavailable_asset_reference",
        `Resolver asset reference ${assetId} is not approved for deterministic selection.`
      );
    }

    if (!manifestRegistry.findManifestByAssetId(assetId)) {
      throw createResolverValidationError(
        "missing_manifest_reference",
        `Resolver asset reference ${assetId} does not have an approved manifest.`
      );
    }

    if (
      typeof manifestRegistry.isManifestAvailable === "function" &&
      !manifestRegistry.isManifestAvailable(assetId)
    ) {
      throw createResolverValidationError(
        "unavailable_manifest_reference",
        `Resolver asset reference ${assetId} has a manifest that is not approved for selection.`
      );
    }
  }
}

function collectResolverCandidates(normalizedInput, options) {
  const {
    assetRegistry,
    manifestRegistry,
    recipeRegistry
  } = options;

  return normalizedInput.availableAssetReferences
    .map((assetId) => {
      const asset = assetRegistry.findAssetById(assetId);
      const manifest = manifestRegistry.findManifestByAssetId(assetId);
      const recipe = manifest
        ? recipeRegistry?.findRecipeById?.(manifest.recipeId) ?? null
        : null;

      return {
        assetId,
        asset,
        manifest,
        recipe
      };
    })
    .filter((candidate) => {
      if (!candidate.asset || !candidate.manifest || !candidate.recipe) {
        return false;
      }

      if (normalizedInput.assetCategory) {
        const categoryMatch =
          candidate.asset.category === normalizedInput.assetCategory &&
          candidate.manifest.category === normalizedInput.assetCategory;

        if (!categoryMatch) {
          return false;
        }
      }

      if (normalizedInput.assetType) {
        if (candidate.recipe.assetType !== normalizedInput.assetType) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => left.assetId.localeCompare(right.assetId));
}

function normalizeResolverOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return Object.freeze({
      assetRegistry: null,
      manifestRegistry: null,
      recipeRegistry: null
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
        : null
  });
}

function normalizeCoordinates(rawCoordinates) {
  const coordinates = asPlainObject(rawCoordinates, "coordinates");

  return deepFreeze({
    x: normalizeFiniteNumber(coordinates.x, "coordinates.x"),
    y: normalizeFiniteNumber(coordinates.y, "coordinates.y")
  });
}

function normalizeResolverRules(rawResolverRules) {
  const resolverRules = asPlainObject(rawResolverRules, "resolverRules");
  const variantPolicy = normalizeStringValue(
    resolverRules.variantPolicy ?? "seeded-index",
    "resolverRules.variantPolicy"
  );

  if (!["seeded-index", "seeded-category-pool"].includes(variantPolicy)) {
    throw createResolverValidationError(
      "invalid_variant_policy",
      `Resolver variant policy ${variantPolicy} is not approved.`
    );
  }

  return deepFreeze({
    variantPolicy,
    variantOffset: normalizeInteger(
      resolverRules.variantOffset ?? 0,
      "resolverRules.variantOffset"
    )
  });
}

function assertRequiredFields(input) {
  for (const fieldName of deterministicAssetResolverRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(input, fieldName)) {
      throw createResolverValidationError(
        "missing_required_field",
        `Deterministic resolver input is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createResolverValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent asset IDs.`
    );
  }

  if (value.length === 0) {
    throw createResolverValidationError(
      "invalid_field_value",
      `Field ${fieldName} must contain at least one asset reference.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();

  if (!permanentIdPattern.test(normalized)) {
    throw createResolverValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizeOptionalCategory(value) {
  if (typeof value === "undefined" || value === null) {
    return null;
  }

  const normalized = normalizeStringValue(value, "assetCategory");
  if (!assetFactoryCategories.includes(normalized)) {
    throw createResolverValidationError(
      "invalid_category",
      `Resolver asset category ${normalized} is not part of the approved Asset Factory categories.`
    );
  }

  return normalized;
}

function normalizeOptionalStringValue(value, fieldName) {
  if (typeof value === "undefined" || value === null) {
    return null;
  }

  return normalizeStringValue(value, fieldName);
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createResolverValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createResolverValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createResolverValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a finite number.`
    );
  }

  return value;
}

function normalizeInteger(value, fieldName) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw createResolverValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an integer.`
    );
  }

  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createResolverValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createResolverValidationError(code, message) {
  const error = new Error(message);
  error.name = "DeterministicAssetResolverValidationError";
  error.code = code;
  return error;
}

function stableHash(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
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
