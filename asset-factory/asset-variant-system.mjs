import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";

export const assetVariantSystemSchemaId = "ASSET_VARIANT_SYSTEM_001";
export const assetVariantAssignmentSchemaId = "ASSET_VARIANT_ASSIGNMENT_001";
export const assetVariantValidationSchemaId = "ASSET_VARIANT_VALIDATION_001";

const supportedContextKeys = deepFreeze([
  "biome",
  "climate",
  "regionProfile",
  "environmentType",
  "styleProfile"
]);

const variantCatalog = deepFreeze([
  variantDefinition({
    baseReferenceType: "asset",
    baseReferenceId: "TREE_EUCALYPTUS_001",
    variantId: "coastal",
    targetAssetId: "TREE_COASTAL_001",
    priority: 30,
    conditions: {
      biome: ["COASTAL", "BEACH_EDGE", "DUNE_SYSTEM"],
      climate: ["MARITIME", "COASTAL_TEMPERATE"],
      regionProfile: ["SMALL_COASTAL_TOWN", "AUSTRALIAN_COASTAL_WORLD", "COASTAL_REGION"],
      environmentType: ["COASTAL_PARK", "BEACH_EDGE_PREVIEW", "FORESHORE"],
      styleProfile: ["PAPERCUT_COASTAL", "BRIGHT_COASTAL"]
    }
  }),
  variantDefinition({
    baseReferenceType: "asset",
    baseReferenceId: "TREE_EUCALYPTUS_001",
    variantId: "urban",
    targetAssetId: "TREE_COASTAL_001",
    priority: 20,
    conditions: {
      biome: ["URBAN_STREET", "SUBURBAN_PARKLAND"],
      climate: ["TEMPERATE", "COASTAL_TEMPERATE"],
      regionProfile: ["SUBURBAN_CITY_EDGE", "METROPOLITAN_EXPANSION_WORLD"],
      environmentType: ["STREET_TREE", "RESIDENTIAL_EDGE", "PARK_TREATMENT"],
      styleProfile: ["CLEAN_URBAN", "PAPERCUT_STANDARD"]
    }
  }),
  variantDefinition({
    baseReferenceType: "asset",
    baseReferenceId: "TREE_EUCALYPTUS_001",
    variantId: "forest",
    targetAssetId: "TREE_EUCALYPTUS_001",
    priority: 10,
    isDefault: true,
    conditions: {
      biome: ["FOREST_EDGE", "WOODLAND", "TEMPERATE_FOREST_EDGE"],
      climate: ["TEMPERATE", "COOL_TEMPERATE"],
      regionProfile: ["ALPINE_WORLD", "MOUNTAIN_REGION"],
      environmentType: ["FOREST", "FOREST_EDGE", "NATURE_RESERVE"],
      styleProfile: ["NATURAL_LAYERED", "PAPERCUT_STANDARD"]
    }
  }),
  variantDefinition({
    baseReferenceType: "asset",
    baseReferenceId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    variantId: "coastal",
    targetAssetId: "BUILDING_RESIDENTIAL_HOUSE_COASTAL_001",
    priority: 30,
    conditions: {
      biome: ["COASTAL", "BEACH_EDGE"],
      climate: ["MARITIME", "COASTAL_TEMPERATE"],
      regionProfile: ["SMALL_COASTAL_TOWN", "AUSTRALIAN_COASTAL_WORLD"],
      environmentType: ["RESIDENTIAL_COASTAL", "WATERFRONT_EDGE"],
      styleProfile: ["PAPERCUT_COASTAL", "BRIGHT_COASTAL"]
    }
  }),
  variantDefinition({
    baseReferenceType: "asset",
    baseReferenceId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    variantId: "rural",
    targetAssetId: "BUILDING_RESIDENTIAL_HOUSE_RURAL_001",
    priority: 20,
    conditions: {
      biome: ["RURAL_EDGE", "FARMLAND", "GRASSLAND"],
      climate: ["DRY_TEMPERATE", "TEMPERATE"],
      regionProfile: ["REGIONAL_TOWN", "AUSTRALIAN_OUTBACK_WORLD"],
      environmentType: ["RURAL_RESIDENTIAL", "LOW_DENSITY_FRINGE"],
      styleProfile: ["PAPERCUT_STANDARD", "QUIET_RURAL"]
    }
  }),
  variantDefinition({
    baseReferenceType: "asset",
    baseReferenceId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    variantId: "suburban",
    targetAssetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    priority: 10,
    isDefault: true,
    conditions: {
      biome: ["SUBURBAN_PARKLAND", "TEMPERATE_GRASSLAND"],
      climate: ["TEMPERATE", "COASTAL_TEMPERATE"],
      regionProfile: ["SUBURBAN_CITY_EDGE", "SMALL_WORLD"],
      environmentType: ["RESIDENTIAL_AREA", "SUBURBAN_STREET_SCENE"],
      styleProfile: ["PAPERCUT_STANDARD", "CLEAN_SUBURBAN"]
    }
  }),
  variantDefinition({
    baseReferenceType: "recipe",
    baseReferenceId: "BAKERY_RECIPE_001",
    variantId: "town",
    targetAssetId: "BUILDING_COMMERCIAL_BAKERY_SMALL_001",
    priority: 20,
    isDefault: true,
    conditions: {
      biome: ["TOWN_CENTRE", "TEMPERATE_GRASSLAND"],
      climate: ["TEMPERATE", "COOL_TEMPERATE"],
      regionProfile: ["REGIONAL_TOWN", "SMALL_WORLD"],
      environmentType: ["MAIN_STREET", "COMMERCIAL_AREA"],
      styleProfile: ["PAPERCUT_STANDARD", "MAIN_STREET_ACTIVE"]
    }
  }),
  variantDefinition({
    baseReferenceType: "recipe",
    baseReferenceId: "BAKERY_RECIPE_001",
    variantId: "coastal",
    targetAssetId: "BUILDING_COMMERCIAL_BAKERY_SMALL_001",
    priority: 30,
    conditions: {
      biome: ["COASTAL", "BEACH_EDGE"],
      climate: ["MARITIME", "COASTAL_TEMPERATE"],
      regionProfile: ["SMALL_COASTAL_TOWN", "AUSTRALIAN_COASTAL_WORLD"],
      environmentType: ["FORESHORE_MAIN_STREET", "COASTAL_COMMERCIAL"],
      styleProfile: ["PAPERCUT_COASTAL", "BRIGHT_COASTAL"]
    }
  }),
  variantDefinition({
    baseReferenceType: "recipe",
    baseReferenceId: "BAKERY_RECIPE_001",
    variantId: "urban",
    targetAssetId: "BUILDING_COMMERCIAL_BAKERY_SMALL_001",
    priority: 25,
    conditions: {
      biome: ["URBAN_STREET", "CITY_EDGE"],
      climate: ["TEMPERATE", "COASTAL_TEMPERATE"],
      regionProfile: ["SUBURBAN_CITY_EDGE", "METROPOLITAN_EXPANSION_WORLD"],
      environmentType: ["HIGH_STREET", "COMMERCIAL_STRIP"],
      styleProfile: ["CLEAN_URBAN", "DENSE_COMMERCIAL"]
    }
  })
]);

export function createAssetVariantSystem(rawRegistry = createAssetFactoryRegistryLayer()) {
  const registry = normalizeRegistry(rawRegistry);
  const definitions = deepFreeze(
    variantCatalog
      .map((definition) => hydrateVariantDefinition(definition, registry))
      .sort(compareByVariantKey)
  );
  const variantMap = buildVariantMap(definitions);
  const validation = buildVariantSystemValidation(definitions, registry);

  const system = deepFreeze({
    schemaId: assetVariantSystemSchemaId,
    systemId: "ASSET_VARIANT_SYSTEM_001_DEFAULT",
    registryId: registry.registryId,
    definitions,
    validation,
    resolveVariant(rawSelection) {
      return resolveAssetVariantAssignment(rawSelection, registry, variantMap);
    }
  });

  const checked = validateAssetVariantSystem(system);
  if (!checked.ok) {
    throw createVariantValidationError(checked.errorCode, checked.message);
  }

  return system;
}

export function validateAssetVariantSystem(rawSystem) {
  try {
    if (rawSystem?.schemaId !== assetVariantSystemSchemaId) {
      throw createVariantValidationError(
        "invalid_asset_variant_system_schema",
        `Expected ${assetVariantSystemSchemaId} but received ${rawSystem?.schemaId}.`
      );
    }

    if (!Array.isArray(rawSystem.definitions) || rawSystem.definitions.length === 0) {
      throw createVariantValidationError(
        "invalid_asset_variant_definitions",
        "Asset variant system must expose a non-empty definitions array."
      );
    }

    if (rawSystem.validation?.schemaId !== assetVariantValidationSchemaId) {
      throw createVariantValidationError(
        "invalid_asset_variant_validation_schema",
        `Expected ${assetVariantValidationSchemaId} but received ${rawSystem.validation?.schemaId}.`
      );
    }

    for (const key of [
      "variantExists",
      "baseAssetExists",
      "deterministicSelection",
      "compatibilityPreserved",
      "validationPassed"
    ]) {
      if (rawSystem.validation[key] !== true) {
        throw createVariantValidationError(
          "asset_variant_system_validation_failed",
          `Asset variant validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(
      rawSystem.definitions.map((definition) => [
        definition.baseReferenceType,
        definition.baseReferenceId,
        definition.variantId,
        definition.targetAssetId,
        definition.priority,
        definition.isDefault,
        definition.baseAssetId,
        definition.compatibilityPreserved
      ])
    );

    if (expectedHash !== rawSystem.validation.deterministicVariantHash) {
      throw createVariantValidationError(
        "asset_variant_hash_mismatch",
        "Asset variant system deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetVariantSystem: rawSystem
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_variant_system_validation_failed",
      message: error.message,
      assetVariantSystem: null
    });
  }
}

export function validateAssetVariantAssignment(
  rawAssignment,
  rawSystem = createAssetVariantSystem()
) {
  try {
    const system = normalizeVariantSystem(rawSystem);

    if (rawAssignment?.schemaId !== assetVariantAssignmentSchemaId) {
      throw createVariantValidationError(
        "invalid_asset_variant_assignment_schema",
        `Expected ${assetVariantAssignmentSchemaId} but received ${rawAssignment?.schemaId}.`
      );
    }

    if (rawAssignment.validation?.schemaId !== assetVariantValidationSchemaId) {
      throw createVariantValidationError(
        "invalid_asset_variant_assignment_validation_schema",
        `Expected ${assetVariantValidationSchemaId} but received ${rawAssignment.validation?.schemaId}.`
      );
    }

    const matchingDefinitions = system.definitions.filter(
      (definition) =>
        definition.baseReferenceType === rawAssignment.baseReferenceType &&
        definition.baseReferenceId === rawAssignment.baseReferenceId &&
        definition.variantId === rawAssignment.selectedVariant
    );

    if (matchingDefinitions.length !== 1) {
      throw createVariantValidationError(
        "missing_asset_variant_definition",
        `No variant definition exists for ${rawAssignment.baseReferenceType}:${rawAssignment.baseReferenceId} -> ${rawAssignment.selectedVariant}.`
      );
    }

    const matchingDefinition = matchingDefinitions[0];
    if (matchingDefinition.targetAssetId !== rawAssignment.assetId) {
      throw createVariantValidationError(
        "asset_variant_target_mismatch",
        `Variant ${rawAssignment.selectedVariant} must resolve to ${matchingDefinition.targetAssetId}.`
      );
    }

    for (const key of [
      "variantExists",
      "baseAssetExists",
      "deterministicSelection",
      "compatibilityPreserved",
      "validationPassed"
    ]) {
      if (rawAssignment.validation[key] !== true) {
        throw createVariantValidationError(
          "asset_variant_assignment_validation_failed",
          `Asset variant assignment validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash([
      rawAssignment.baseReferenceType,
      rawAssignment.baseReferenceId,
      rawAssignment.baseAssetId,
      rawAssignment.assetId,
      rawAssignment.selectedVariant,
      rawAssignment.reason,
      rawAssignment.environmentContext
    ]);

    if (expectedHash !== rawAssignment.validation.deterministicVariantHash) {
      throw createVariantValidationError(
        "asset_variant_assignment_hash_mismatch",
        "Asset variant assignment deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetVariantAssignment: rawAssignment
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_variant_assignment_validation_failed",
      message: error.message,
      assetVariantAssignment: null
    });
  }
}

function resolveAssetVariantAssignment(rawSelection, registry, variantMap) {
  const selection = normalizeVariantSelection(rawSelection);
  const lookupKey = createVariantGroupKey(selection.baseReferenceType, selection.baseReferenceId);
  const definitions = variantMap.get(lookupKey) ?? [];

  if (definitions.length === 0) {
    throw createVariantValidationError(
      "missing_asset_variant_group",
      `No variant group is registered for ${selection.baseReferenceType}:${selection.baseReferenceId}.`
    );
  }

  const ranked = definitions
    .map((definition) => ({
      definition,
      score: scoreDefinition(definition, selection.environmentContext)
    }))
    .sort(compareRankedDefinitions);

  const selected =
    ranked.find((entry) => entry.score > 0)?.definition ??
    definitions.find((definition) => definition.isDefault) ??
    definitions[0];

  const reason = buildSelectionReason(selected, selection.environmentContext);
  const validation = buildVariantAssignmentValidation(selected, selection, reason);

  const assignment = deepFreeze({
    schemaId: assetVariantAssignmentSchemaId,
    assignmentId: [
      "ASSET_VARIANT_ASSIGNMENT",
      normalizeSlug(selection.baseReferenceId),
      normalizeSlug(selected.variantId)
    ].join("_"),
    assetId: selected.targetAssetId,
    baseAssetId: selected.baseAssetId,
    baseReferenceType: selection.baseReferenceType,
    baseReferenceId: selection.baseReferenceId,
    selectedVariant: selected.variantId,
    reason,
    environmentContext: selection.environmentContext,
    validation
  });

  const checked = validateAssetVariantAssignment(assignment, {
    schemaId: assetVariantSystemSchemaId,
    definitions,
    validation: {
      schemaId: assetVariantValidationSchemaId,
      variantExists: true,
      baseAssetExists: true,
      deterministicSelection: true,
      compatibilityPreserved: true,
      validationPassed: true,
      deterministicVariantHash: computeDeterministicHash(
        definitions.map((definition) => [
          definition.baseReferenceId,
          definition.variantId,
          definition.targetAssetId
        ])
      )
    }
  });

  if (!checked.ok) {
    throw createVariantValidationError(checked.errorCode, checked.message);
  }

  return assignment;
}

function normalizeRegistry(rawRegistry) {
  if (
    !rawRegistry ||
    rawRegistry.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001" ||
    typeof rawRegistry.getAssetById !== "function" ||
    typeof rawRegistry.getAssetByRecipeId !== "function"
  ) {
    throw createVariantValidationError(
      "invalid_asset_registry_input",
      "Asset variant system requires a valid Asset Factory registry layer."
    );
  }

  return rawRegistry;
}

function normalizeVariantSystem(rawSystem) {
  if (rawSystem?.schemaId !== assetVariantSystemSchemaId || !Array.isArray(rawSystem.definitions)) {
    throw createVariantValidationError(
      "invalid_asset_variant_system_input",
      "Asset variant assignment validation requires a valid variant system."
    );
  }

  return rawSystem;
}

function hydrateVariantDefinition(definition, registry) {
  const baseAsset =
    definition.baseReferenceType === "asset"
      ? registry.getAssetById(definition.baseReferenceId)
      : registry.getAssetByRecipeId(definition.baseReferenceId);
  const targetAsset = registry.getAssetById(definition.targetAssetId);

  if (!baseAsset) {
    throw createVariantValidationError(
      "missing_asset_variant_base",
      `Base ${definition.baseReferenceType} ${definition.baseReferenceId} is not registered.`
    );
  }

  if (!targetAsset) {
    throw createVariantValidationError(
      "missing_asset_variant_target",
      `Target asset ${definition.targetAssetId} is not registered.`
    );
  }

  return deepFreeze({
    ...definition,
    baseAssetId: baseAsset.assetId,
    compatibilityPreserved: isCompatibilityPreserved(baseAsset, targetAsset)
  });
}

function buildVariantMap(definitions) {
  const map = new Map();
  for (const definition of definitions) {
    const key = createVariantGroupKey(definition.baseReferenceType, definition.baseReferenceId);
    const existing = map.get(key) ?? [];
    existing.push(definition);
    map.set(
      key,
      existing.sort((left, right) =>
        left.priority === right.priority
          ? left.variantId.localeCompare(right.variantId)
          : right.priority - left.priority
      )
    );
  }
  return map;
}

function buildVariantSystemValidation(definitions, registry) {
  const variantExists = definitions.length > 0;
  const baseAssetExists = definitions.every((definition) => Boolean(definition.baseAssetId));
  const deterministicSelection = true;
  const compatibilityPreserved = definitions.every(
    (definition) =>
      definition.compatibilityPreserved === true &&
      registry.getAssetById(definition.targetAssetId) !== null
  );
  const validationPassed =
    variantExists && baseAssetExists && deterministicSelection && compatibilityPreserved;

  return deepFreeze({
    schemaId: assetVariantValidationSchemaId,
    variantExists,
    baseAssetExists,
    deterministicSelection,
    compatibilityPreserved,
    validationPassed,
    deterministicVariantHash: computeDeterministicHash(
      definitions.map((definition) => [
        definition.baseReferenceType,
        definition.baseReferenceId,
        definition.variantId,
        definition.targetAssetId,
        definition.priority,
        definition.isDefault,
        definition.baseAssetId,
        definition.compatibilityPreserved
      ])
    )
  });
}

function buildVariantAssignmentValidation(definition, selection, reason) {
  const validationSource = [
    selection.baseReferenceType,
    selection.baseReferenceId,
    definition.baseAssetId,
    definition.targetAssetId,
    definition.variantId,
    reason,
    selection.environmentContext
  ];

  return deepFreeze({
    schemaId: assetVariantValidationSchemaId,
    variantExists: true,
    baseAssetExists: true,
    deterministicSelection: true,
    compatibilityPreserved: definition.compatibilityPreserved === true,
    validationPassed: definition.compatibilityPreserved === true,
    deterministicVariantHash: computeDeterministicHash(validationSource)
  });
}

function normalizeVariantSelection(rawSelection) {
  const selection = asPlainObject(rawSelection, "variantSelection");
  const hasAssetReference = isPresent(selection.baseAssetId);
  const hasRecipeReference = isPresent(selection.baseRecipeId);

  if (hasAssetReference === hasRecipeReference) {
    throw createVariantValidationError(
      "invalid_asset_variant_reference",
      "Provide either baseAssetId or baseRecipeId for variant resolution."
    );
  }

  const baseReferenceType = hasAssetReference ? "asset" : "recipe";
  const baseReferenceId = normalizeStringValue(
    hasAssetReference ? selection.baseAssetId : selection.baseRecipeId,
    hasAssetReference ? "baseAssetId" : "baseRecipeId"
  );

  return deepFreeze({
    baseReferenceType,
    baseReferenceId,
    environmentContext: normalizeEnvironmentContext(selection.environmentContext)
  });
}

function normalizeEnvironmentContext(rawContext) {
  const context = asPlainObject(rawContext ?? {}, "environmentContext");
  const normalized = {};

  for (const key of supportedContextKeys) {
    normalized[key] = isPresent(context[key])
      ? normalizeStringValue(context[key], `environmentContext.${key}`)
      : "GENERIC";
  }

  return deepFreeze(normalized);
}

function scoreDefinition(definition, environmentContext) {
  let score = 0;

  for (const key of supportedContextKeys) {
    const supportedValues = definition.conditions[key] ?? [];
    if (supportedValues.includes(environmentContext[key])) {
      score += 1;
    }
  }

  return score;
}

function buildSelectionReason(definition, environmentContext) {
  const matchedContext = supportedContextKeys
    .filter((key) => (definition.conditions[key] ?? []).includes(environmentContext[key]))
    .map((key) => `${key}:${environmentContext[key]}`);

  if (matchedContext.length === 0) {
    return `default_variant:${definition.variantId}`;
  }

  return `matched_${definition.variantId}:${matchedContext.join("|")}`;
}

function isCompatibilityPreserved(baseAsset, targetAsset) {
  if (!baseAsset || !targetAsset) {
    return false;
  }

  return (
    baseAsset.assetId === targetAsset.assetId ||
    baseAsset.recipeId === targetAsset.recipeId ||
    baseAsset.assetType === targetAsset.assetType ||
    hasOverlap(
      baseAsset.atlasCompatibility.supportedObjectTypes,
      targetAsset.atlasCompatibility.supportedObjectTypes
    ) ||
    hasOverlap(
      baseAsset.atlasCompatibility.supportedClassifications,
      targetAsset.atlasCompatibility.supportedClassifications
    )
  );
}

function hasOverlap(left, right) {
  return left.some((value) => right.includes(value));
}

function variantDefinition({
  baseReferenceType,
  baseReferenceId,
  variantId,
  targetAssetId,
  priority,
  conditions,
  isDefault = false
}) {
  return deepFreeze({
    baseReferenceType: normalizeBaseReferenceType(baseReferenceType),
    baseReferenceId: normalizeStringValue(baseReferenceId, "baseReferenceId"),
    variantId: normalizeStringValue(variantId, "variantId"),
    targetAssetId: normalizeStringValue(targetAssetId, "targetAssetId"),
    priority: normalizePriority(priority),
    conditions: normalizeConditions(conditions),
    isDefault: normalizeBoolean(isDefault, "isDefault")
  });
}

function normalizeConditions(rawConditions) {
  const conditions = asPlainObject(rawConditions ?? {}, "conditions");
  const normalized = {};

  for (const key of supportedContextKeys) {
    normalized[key] = deepFreeze(
      Array.isArray(conditions[key])
        ? conditions[key].map((value) => normalizeStringValue(value, `conditions.${key}`)).sort()
        : []
    );
  }

  return deepFreeze(normalized);
}

function normalizeBaseReferenceType(value) {
  const normalized = normalizeStringValue(value, "baseReferenceType").toLowerCase();
  if (!["asset", "recipe"].includes(normalized)) {
    throw createVariantValidationError(
      "invalid_asset_variant_reference_type",
      `Unsupported baseReferenceType ${value}.`
    );
  }
  return normalized;
}

function normalizePriority(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw createVariantValidationError(
      "invalid_asset_variant_priority",
      "Variant priority must be a non-negative integer."
    );
  }
  return value;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createVariantValidationError(
      "invalid_asset_variant_field",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createVariantValidationError(
      "invalid_asset_variant_boolean",
      `Field ${fieldName} must be a boolean.`
    );
  }
  return value;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createVariantValidationError(
      "invalid_asset_variant_object",
      `Field ${fieldName} must be an object.`
    );
  }
  return value;
}

function createVariantGroupKey(baseReferenceType, baseReferenceId) {
  return `${baseReferenceType}:${baseReferenceId}`;
}

function compareByVariantKey(left, right) {
  const leftKey = createVariantGroupKey(left.baseReferenceType, left.baseReferenceId);
  const rightKey = createVariantGroupKey(right.baseReferenceType, right.baseReferenceId);

  if (leftKey === rightKey) {
    return left.variantId.localeCompare(right.variantId);
  }

  return leftKey.localeCompare(rightKey);
}

function compareRankedDefinitions(left, right) {
  if (left.score !== right.score) {
    return right.score - left.score;
  }
  if (left.definition.priority !== right.definition.priority) {
    return right.definition.priority - left.definition.priority;
  }
  return left.definition.variantId.localeCompare(right.definition.variantId);
}

function isPresent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeSlug(value) {
  return value.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function computeDeterministicHash(value) {
  const source = JSON.stringify(sortKeys(value));
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `VARIANT_${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortKeys(entry));
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = sortKeys(value[key]);
        return result;
      }, {});
  }

  return value;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return value;
}

function createVariantValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetVariantValidationError";
  error.code = code;
  return error;
}
