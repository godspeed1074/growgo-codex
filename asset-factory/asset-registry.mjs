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

export const assetFactoryRegistryLayerSchemaId = "ASSET_FACTORY_REGISTRY_LAYER_001";
export const assetRegistryValidationSchemaId = "ASSET_REGISTRY_VALIDATION_001";

export const assetFactoryRecordRequiredFields = Object.freeze([
  "assetId",
  "assetFamily",
  "assetType",
  "recipeId",
  "version",
  "lodRules",
  "usageRules",
  "atlasCompatibility"
]);

export const atlasCompatibleRecipeIds = Object.freeze([
  "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001",
  "BUILDING_SHOP_GENERAL_RECIPE_001",
  "RECIPE_BUILDING_BAKERY_SMALL_TOWN_001",
  "RECIPE_BUILDING_CAFE_COASTAL_001",
  "RECIPE_BUILDING_FUEL_STATION_STANDARD_001"
]);

export const onboardedExistingAssetRecords = deepFreeze([
  deepFreeze({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    assetFamily: "FAMILY_BUILDING_RESIDENTIAL_HOUSE",
    assetType: "RESIDENTIAL_HOUSE",
    recipeId: "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001",
    version: "1.0.0",
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
    usageRules: deepFreeze([
      "suburban_residential",
      "detached_house_only",
      "atlas_residential_assignment"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["HOUSE"]),
      supportedClassifications: deepFreeze(["RESIDENTIAL"]),
      atlasAssignmentRecipeIds: deepFreeze([
        "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001"
      ]),
      assignmentMode: "direct_recipe_match"
    }),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["BUILDING_HOUSE_SUBURBAN_BRICK_001"]),
      sourceRecipeReferences: deepFreeze(["RECIPE_HOUSE_SUBURBAN_BRICK_001"]),
      existingWorkPreserved: true,
      onboardingSource: "SESSION_110_EXISTING_ASSET_ONBOARDING"
    })
  }),
  deepFreeze({
    assetId: "BUILDING_COMMERCIAL_SMALL_SHOP_001",
    assetFamily: "FAMILY_BUILDING_COMMERCIAL_SMALL_SHOP",
    assetType: "SMALL_SHOP",
    recipeId: "BUILDING_SHOP_GENERAL_RECIPE_001",
    version: "1.0.0",
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
    usageRules: deepFreeze([
      "small_town_commercial",
      "shopfront_only",
      "atlas_business_assignment"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["SHOP", "BAKERY", "CAFE"]),
      supportedClassifications: deepFreeze(["BUSINESS"]),
      atlasAssignmentRecipeIds: deepFreeze([
        "BUILDING_SHOP_GENERAL_RECIPE_001",
        "RECIPE_BUILDING_BAKERY_SMALL_TOWN_001",
        "RECIPE_BUILDING_CAFE_COASTAL_001"
      ]),
      assignmentMode: "recipe_or_business_fallback"
    }),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze([
        "BUILDING_SHOP_GENERAL_001",
        "BUILDING_BAKERY_SMALL_TOWN_001",
        "BUILDING_CAFE_COASTAL_001"
      ]),
      sourceRecipeReferences: deepFreeze([
        "BUILDING_SHOP_GENERAL_RECIPE_001",
        "RECIPE_BAKERY_SMALL_TOWN_001",
        "RECIPE_CAFE_COASTAL_001"
      ]),
      existingWorkPreserved: true,
      onboardingSource: "SESSION_110_EXISTING_ASSET_ONBOARDING"
    })
  })
]);

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

export function createAssetFactoryRegistryLayer(
  initialAssets = onboardedExistingAssetRecords
) {
  const records = normalizeAssetFactoryRecords(initialAssets);
  const registryByAssetId = new Map(records.map((record) => [record.assetId, record]));
  const registryByRecipeId = new Map(records.map((record) => [record.recipeId, record]));
  const validation = buildAssetFactoryRegistryValidation(records);

  const layer = deepFreeze({
    schemaId: assetFactoryRegistryLayerSchemaId,
    registryId: "ASSET_FACTORY_REGISTRY_LAYER_001_DEFAULT",
    records,
    validation,
    getAssetById(assetId) {
      return registryByAssetId.get(normalizeAssetIdInput(assetId)) ?? null;
    },
    getAssetByRecipeId(recipeId) {
      return registryByRecipeId.get(normalizeStringValue(recipeId, "recipeId")) ?? null;
    },
    listAssetsByFamily(assetFamily) {
      const normalizedAssetFamily = normalizeStringValue(assetFamily, "assetFamily");
      return records.filter((record) => record.assetFamily === normalizedAssetFamily);
    },
    resolveAssetForAtlasAssignment(rawAssignment) {
      const assignment = normalizeAtlasAssignment(rawAssignment);
      const directMatch = registryByRecipeId.get(assignment.recipeId);
      if (directMatch) {
        return directMatch;
      }

      return (
        records.find((record) => isRecordCompatibleWithAtlasAssignment(record, assignment)) ??
        null
      );
    }
  });

  const checked = validateAssetFactoryRegistryLayer(layer);
  if (!checked.ok) {
    throw createAssetRegistryValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetFactoryRegistryLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetFactoryRegistryLayerSchemaId) {
      throw createAssetRegistryValidationError(
        "invalid_asset_factory_registry_schema",
        `Expected ${assetFactoryRegistryLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.records) || rawLayer.records.length === 0) {
      throw createAssetRegistryValidationError(
        "invalid_asset_factory_registry_records",
        "Asset Factory registry must expose a non-empty records array."
      );
    }

    normalizeAssetFactoryRecords(rawLayer.records);

    if (rawLayer.validation?.schemaId !== assetRegistryValidationSchemaId) {
      throw createAssetRegistryValidationError(
        "invalid_asset_factory_registry_validation_schema",
        `Expected ${assetRegistryValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "uniqueIds",
      "recipeExists",
      "versionExists",
      "atlasCompatibilityValid",
      "deterministicLookup",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createAssetRegistryValidationError(
          "asset_factory_registry_validation_failed",
          `Asset registry validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicRegistryHash(rawLayer.records);
    if (expectedHash !== rawLayer.validation.deterministicRegistryHash) {
      throw createAssetRegistryValidationError(
        "asset_factory_registry_hash_mismatch",
        "Asset registry deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetFactoryRegistryLayer: rawLayer
    });
  } catch (error) {
    if (error?.name !== "AssetRegistryValidationError") {
      throw error;
    }

    return deepFreeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      assetFactoryRegistryLayer: null
    });
  }
}

function normalizeAssetFactoryRecords(rawRecords) {
  if (!Array.isArray(rawRecords)) {
    throw createAssetRegistryValidationError(
      "invalid_field_type",
      "Asset Factory records must be an array."
    );
  }

  const records = rawRecords.map((rawRecord) => normalizeAssetFactoryRecord(rawRecord));
  const assetIds = new Set();

  for (const record of records) {
    if (assetIds.has(record.assetId)) {
      throw createAssetRegistryValidationError(
        "duplicate_asset_id",
        `Asset ID ${record.assetId} already exists in the Asset Factory registry layer.`
      );
    }
    assetIds.add(record.assetId);
  }

  return deepFreeze(records.sort((left, right) => left.assetId.localeCompare(right.assetId)));
}

function normalizeAssetFactoryRecord(rawRecord) {
  const record = asPlainObject(rawRecord, "assetFactoryRecord");
  assertAssetFactoryRequiredFields(record);

  const assetId = normalizeAssetIdInput(record.assetId);
  if (!assetIdPattern.test(assetId)) {
    throw createAssetRegistryValidationError(
      "invalid_asset_id",
      `Asset ID ${assetId} must use the permanent uppercase Asset Factory ID format.`
    );
  }

  const assetFamily = normalizeStringValue(record.assetFamily, "assetFamily");
  const assetType = normalizeStringValue(record.assetType, "assetType");
  const recipeId = normalizeStringValue(record.recipeId, "recipeId");
  const version = normalizeStringValue(record.version, "version");
  if (!versionPattern.test(version)) {
    throw createAssetRegistryValidationError(
      "invalid_version",
      `Asset version ${version} must use the approved registry version format.`
    );
  }

  const atlasCompatibility = normalizeAtlasCompatibility(record.atlasCompatibility);

  return deepFreeze({
    assetId,
    assetFamily,
    assetType,
    recipeId,
    version,
    lodRules: deepFreeze(normalizeStringArray(record.lodRules, "lodRules")),
    usageRules: deepFreeze(normalizeStringArray(record.usageRules, "usageRules")),
    atlasCompatibility,
    metadata: record.metadata ? deepFreeze(asPlainObject(record.metadata, "metadata")) : deepFreeze({})
  });
}

function assertAssetFactoryRequiredFields(record) {
  for (const fieldName of assetFactoryRecordRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(record, fieldName)) {
      throw createAssetRegistryValidationError(
        "missing_required_field",
        `Asset Factory record is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeAtlasCompatibility(rawAtlasCompatibility) {
  const atlasCompatibility = asPlainObject(rawAtlasCompatibility, "atlasCompatibility");
  return deepFreeze({
    atlasCompatible: normalizeBoolean(
      atlasCompatibility.atlasCompatible,
      "atlasCompatibility.atlasCompatible"
    ),
    supportedObjectTypes: deepFreeze(
      normalizeStringArray(
        atlasCompatibility.supportedObjectTypes,
        "atlasCompatibility.supportedObjectTypes"
      )
    ),
    supportedClassifications: deepFreeze(
      normalizeStringArray(
        atlasCompatibility.supportedClassifications,
        "atlasCompatibility.supportedClassifications"
      )
    ),
    atlasAssignmentRecipeIds: deepFreeze(
      normalizeStringArray(
        atlasCompatibility.atlasAssignmentRecipeIds,
        "atlasCompatibility.atlasAssignmentRecipeIds"
      )
    ),
    assignmentMode: normalizeStringValue(
      atlasCompatibility.assignmentMode,
      "atlasCompatibility.assignmentMode"
    )
  });
}

function normalizeAtlasAssignment(rawAssignment) {
  const assignment = asPlainObject(rawAssignment, "atlasAssignment");
  return deepFreeze({
    objectId: normalizeStringValue(assignment.objectId, "atlasAssignment.objectId"),
    objectType: normalizeStringValue(assignment.objectType, "atlasAssignment.objectType"),
    recipeId: normalizeStringValue(assignment.recipeId, "atlasAssignment.recipeId")
  });
}

function isRecordCompatibleWithAtlasAssignment(record, assignment) {
  return (
    record.atlasCompatibility.atlasCompatible &&
    (record.recipeId === assignment.recipeId ||
      record.atlasCompatibility.atlasAssignmentRecipeIds.includes(assignment.recipeId) ||
      record.atlasCompatibility.supportedObjectTypes.includes(assignment.objectType))
  );
}

function buildAssetFactoryRegistryValidation(records) {
  const uniqueIds = new Set(records.map((record) => record.assetId)).size === records.length;
  const recipeExists = records.every(
    (record) =>
      atlasCompatibleRecipeIds.includes(record.recipeId) ||
      record.atlasCompatibility.atlasAssignmentRecipeIds.every((recipeId) =>
        atlasCompatibleRecipeIds.includes(recipeId)
      )
  );
  const versionExists = records.every((record) => versionPattern.test(record.version));
  const atlasCompatibilityValid = records.every(
    (record) =>
      record.atlasCompatibility.atlasCompatible === true &&
      record.atlasCompatibility.supportedObjectTypes.length > 0 &&
      record.atlasCompatibility.atlasAssignmentRecipeIds.length > 0
  );
  const deterministicLookup = true;
  const validationPassed =
    uniqueIds &&
    recipeExists &&
    versionExists &&
    atlasCompatibilityValid &&
    deterministicLookup;

  return deepFreeze({
    schemaId: assetRegistryValidationSchemaId,
    uniqueIds,
    recipeExists,
    versionExists,
    atlasCompatibilityValid,
    deterministicLookup,
    validationPassed,
    deterministicRegistryHash: computeDeterministicRegistryHash(records)
  });
}

function computeDeterministicRegistryHash(records) {
  return stableStringify(
    records.map((record) => ({
      assetId: record.assetId,
      assetFamily: record.assetFamily,
      assetType: record.assetType,
      recipeId: record.recipeId,
      version: record.version,
      lodRules: record.lodRules,
      usageRules: record.usageRules,
      atlasCompatibility: record.atlasCompatibility
    }))
  );
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

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createAssetRegistryValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
    );
  }

  return value;
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

function stableStringify(value) {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}
