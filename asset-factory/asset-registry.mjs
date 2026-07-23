export const assetFactoryCategories = Object.freeze([
  "buildings",
  "terrain",
  "roads",
  "rail",
  "nature",
  "landmarks",
  "npcs",
  "animals",
  "vehicles",
  "decorations",
  "seasonal_assets"
]);

export const assetRegistryStatuses = Object.freeze([
  "draft",
  "validated",
  "deprecated",
  "retired",
  "blocked"
]);

export const assetRegistryRequiredFields = Object.freeze([
  "assetId",
  "category",
  "version",
  "status",
  "components",
  "tags",
  "metadata"
]);

const assetIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;

export function createAssetRegistry(initialAssets = []) {
  const assetMap = new Map();

  for (const asset of initialAssets) {
    addAsset(asset);
  }

  return Object.freeze({
    addAsset,
    hasAsset(assetId) {
      return assetMap.has(normalizeAssetIdInput(assetId));
    },
    findAssetById(assetId) {
      const record = assetMap.get(normalizeAssetIdInput(assetId));
      return record ?? null;
    },
    getAssetMetadata(assetId) {
      const record = assetMap.get(normalizeAssetIdInput(assetId));
      return record ? record.metadata : null;
    },
    getAssetComponentDependencies(assetId) {
      const record = assetMap.get(normalizeAssetIdInput(assetId));
      return record ? record.components : null;
    },
    isAssetAvailable(assetId) {
      const record = assetMap.get(normalizeAssetIdInput(assetId));
      return record ? record.status === "validated" : false;
    },
    listAssets() {
      return Array.from(assetMap.values());
    },
    listAssetIds() {
      return Array.from(assetMap.keys());
    },
    size() {
      return assetMap.size;
    }
  });

  function addAsset(rawAsset) {
    const normalizedAsset = normalizeAssetRecord(rawAsset);
    const duplicate = assetMap.get(normalizedAsset.assetId);

    if (duplicate) {
      throw createAssetRegistryValidationError(
        "duplicate_asset_id",
        `Asset ID ${normalizedAsset.assetId} already exists in the registry.`
      );
    }

    assetMap.set(normalizedAsset.assetId, normalizedAsset);
    return normalizedAsset;
  }
}

export function validateAssetRecord(rawAsset, options = {}) {
  try {
    const normalizedAsset = normalizeAssetRecord(rawAsset, options);
    return Object.freeze({
      ok: true,
      normalizedAsset,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "AssetRegistryValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedAsset: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizeAssetRecord(rawAsset) {
  const asset = asPlainObject(rawAsset, "asset");

  assertRequiredFields(asset);

  const assetId = normalizeAssetIdInput(asset.assetId);
  if (!assetIdPattern.test(assetId)) {
    throw createAssetRegistryValidationError(
      "invalid_asset_id",
      `Asset ID ${assetId} must use the permanent uppercase Asset Factory ID format.`
    );
  }

  const category = normalizeStringValue(asset.category, "category");
  if (!assetFactoryCategories.includes(category)) {
    throw createAssetRegistryValidationError(
      "invalid_category",
      `Asset category ${category} is not part of the approved Asset Factory categories.`
    );
  }

  const version = normalizeStringValue(asset.version, "version");
  if (!versionPattern.test(version)) {
    throw createAssetRegistryValidationError(
      "invalid_version",
      `Asset version ${version} must use the approved registry version format.`
    );
  }

  const status = normalizeStringValue(asset.status, "status");
  if (!assetRegistryStatuses.includes(status)) {
    throw createAssetRegistryValidationError(
      "invalid_status",
      `Asset status ${status} is not part of the approved registry status set.`
    );
  }

  const components = normalizeStringArray(asset.components, "components");
  const tags = normalizeStringArray(asset.tags, "tags");
  const metadata = deepFreeze(asPlainObject(asset.metadata, "metadata"));

  return deepFreeze({
    assetId,
    category,
    version,
    status,
    components: deepFreeze(components),
    tags: deepFreeze(tags),
    metadata
  });
}

function assertRequiredFields(asset) {
  for (const fieldName of assetRegistryRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(asset, fieldName)) {
      throw createAssetRegistryValidationError(
        "missing_required_field",
        `Asset record is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeAssetIdInput(value) {
  return normalizeStringValue(value, "assetId").toUpperCase();
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createAssetRegistryValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createAssetRegistryValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createAssetRegistryValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of non-empty strings.`
    );
  }

  return value.map((entry, index) => {
    try {
      return normalizeStringValue(entry, `${fieldName}[${index}]`);
    } catch (error) {
      if (error?.name !== "AssetRegistryValidationError") {
        throw error;
      }

      throw createAssetRegistryValidationError(
        error.code,
        `Field ${fieldName} contains an invalid value at index ${index}.`
      );
    }
  });
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createAssetRegistryValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createAssetRegistryValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetRegistryValidationError";
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
