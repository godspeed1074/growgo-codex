import { createNatureAssetPack, validateNatureAssetPack } from "./asset-registry.mjs";
import { validateGrowgoObjectClassificationLayer } from "./growgo-object-classification.mjs";

export const natureEnvironmentRecipeResolverSchemaId =
  "NATURE_ENVIRONMENT_RECIPE_RESOLVER_001";
export const natureAssetAssignmentsSchemaId = "NATURE_ASSET_ASSIGNMENTS_001";
export const natureRecipeValidationSchemaId = "NATURE_RECIPE_VALIDATION_001";

const supportedEnvironmentTypes = Object.freeze([
  "COASTAL_PARK",
  "SUBURBAN_GARDEN",
  "FOREST",
  "BEACH"
]);

const environmentRecipeCatalog = deepFreeze({
  COASTAL_PARK: deepFreeze({
    recipeId: "COASTAL_PARK_RECIPE_001",
    selectedAssets: deepFreeze([
      createSelectedAssetDefinition("TREE_COASTAL_001", "coastal_tree"),
      createSelectedAssetDefinition("GROUND_COASTAL_GRASS_001", "coastal_grass"),
      createSelectedAssetDefinition("ROCK_COASTAL_001", "coastal_rock")
    ]),
    biomeRules: deepFreeze(["COASTAL", "FORESHORE_PARKLAND", "SUBURBAN_PARKLAND"])
  }),
  SUBURBAN_GARDEN: deepFreeze({
    recipeId: "SUBURBAN_GARDEN_RECIPE_001",
    selectedAssets: deepFreeze([
      createSelectedAssetDefinition("TREE_EUCALYPTUS_001", "garden_tree"),
      createSelectedAssetDefinition("BUSH_NATIVE_001", "garden_bush"),
      createSelectedAssetDefinition("GROUND_COASTAL_GRASS_001", "garden_grass")
    ]),
    biomeRules: deepFreeze(["SUBURBAN_GARDEN", "SUBURBAN_PARKLAND", "URBAN_STREET"])
  }),
  FOREST: deepFreeze({
    recipeId: "FOREST_RECIPE_001",
    selectedAssets: deepFreeze([
      createSelectedAssetDefinition("TREE_EUCALYPTUS_001", "forest_tree"),
      createSelectedAssetDefinition("BUSH_NATIVE_001", "forest_undergrowth"),
      createSelectedAssetDefinition("GROUND_COASTAL_GRASS_001", "forest_ground_treatment")
    ]),
    biomeRules: deepFreeze(["FOREST_EDGE", "TEMPERATE_FOREST_EDGE", "COASTAL"])
  }),
  BEACH: deepFreeze({
    recipeId: "BEACH_RECIPE_001",
    selectedAssets: deepFreeze([
      createSelectedAssetDefinition("GROUND_COASTAL_GRASS_001", "sand_and_coastal_ground"),
      createSelectedAssetDefinition("GROUND_COASTAL_GRASS_001", "coastal_grass"),
      createSelectedAssetDefinition("ROCK_COASTAL_001", "beach_rock")
    ]),
    biomeRules: deepFreeze(["COASTAL", "BEACH_EDGE", "FORESHORE_PARKLAND"])
  })
});

export function createNatureEnvironmentRecipeResolver(rawInput, options = {}) {
  const normalizedInput = normalizeResolverInput(rawInput, options);
  const naturePack = normalizedInput.natureAssetPack;

  const assignments = deepFreeze(
    normalizedInput.environmentObjects
      .map((environmentObject) =>
        buildNatureAssignment(environmentObject, normalizedInput, naturePack)
      )
      .sort(compareBy("objectId"))
  );

  const resolverBase = deepFreeze({
    schemaId: natureEnvironmentRecipeResolverSchemaId,
    resolverId: `${normalizedInput.layerId}_NATURE_ENVIRONMENT_RECIPE_RESOLVER`,
    assignments: deepFreeze({
      schemaId: natureAssetAssignmentsSchemaId,
      entries: assignments
    }),
    validation: null
  });

  const validation = buildNatureRecipeValidation(assignments, naturePack);
  const resolver = deepFreeze({
    ...resolverBase,
    validation
  });

  const checked = validateNatureEnvironmentRecipeResolver(resolver);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return resolver;
}

export function validateNatureEnvironmentRecipeResolver(rawResolver) {
  try {
    if (rawResolver?.schemaId !== natureEnvironmentRecipeResolverSchemaId) {
      throw createValidationError(
        "invalid_nature_environment_recipe_resolver_schema",
        `Expected ${natureEnvironmentRecipeResolverSchemaId} but received ${rawResolver?.schemaId}.`
      );
    }

    if (rawResolver.assignments?.schemaId !== natureAssetAssignmentsSchemaId) {
      throw createValidationError(
        "invalid_nature_asset_assignments_schema",
        `Expected ${natureAssetAssignmentsSchemaId} but received ${rawResolver.assignments?.schemaId}.`
      );
    }

    if (!Array.isArray(rawResolver.assignments.entries) || rawResolver.assignments.entries.length === 0) {
      throw createValidationError(
        "invalid_nature_asset_assignment_entries",
        "Nature environment resolver must expose a non-empty assignment list."
      );
    }

    if (rawResolver.validation?.schemaId !== natureRecipeValidationSchemaId) {
      throw createValidationError(
        "invalid_nature_recipe_validation_schema",
        `Expected ${natureRecipeValidationSchemaId} but received ${rawResolver.validation?.schemaId}.`
      );
    }

    for (const assignment of rawResolver.assignments.entries) {
      assertPresent(assignment.objectId, "Nature assignment objectId is required.");
      assertPresent(
        assignment.environmentType,
        "Nature assignment environmentType is required."
      );
      assertPresent(assignment.recipeId, "Nature assignment recipeId is required.");
      if (!Array.isArray(assignment.selectedAssets) || assignment.selectedAssets.length === 0) {
        throw createValidationError(
          "invalid_nature_selected_assets",
          `Nature assignment ${assignment.objectId} must expose selected assets.`
        );
      }
    }

    for (const key of [
      "assetsExist",
      "biomeCompatibilityValid",
      "atlasCompatibilityValid",
      "deterministicAssignment",
      "validationPassed"
    ]) {
      if (rawResolver.validation[key] !== true) {
        throw createValidationError(
          "nature_recipe_validation_failed",
          `Nature recipe validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawResolver)
    );
    if (expectedHash !== rawResolver.validation.deterministicSignatureHash) {
      throw createValidationError(
        "nature_recipe_signature_mismatch",
        "Nature recipe deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      natureEnvironmentRecipeResolver: rawResolver
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "nature_recipe_validation_failed",
      message: error.message,
      natureEnvironmentRecipeResolver: null
    });
  }
}

function normalizeResolverInput(rawInput, options) {
  const natureAssetPack = normalizeNatureAssetPack(options.natureAssetPack);
  const biomeMetadataByObjectId = normalizeObjectMap(
    options.biomeMetadataByObjectId ?? rawInput?.biomeMetadataByObjectId ?? {}
  );
  const environmentClassificationByObjectId = normalizeObjectMap(
    options.environmentClassificationByObjectId ??
      rawInput?.environmentClassificationByObjectId ??
      {}
  );

  if (rawInput?.schemaId === "GROWGO_OBJECT_CLASSIFICATION_LAYER_001") {
    const validation = validateGrowgoObjectClassificationLayer(rawInput);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_growgo_object_classification_layer",
        validation.message
      );
    }

    return deepFreeze({
      layerId: rawInput.layerId,
      environmentObjects: validation.growgoObjectClassificationLayer.worldObjects.objects.filter(
        isSupportedEnvironmentObject
      ),
      biomeMetadataByObjectId,
      environmentClassificationByObjectId,
      natureAssetPack
    });
  }

  if (rawInput?.schemaId === "GROWGO_WORLD_OBJECTS_001") {
    return deepFreeze({
      layerId: "GROWGO_WORLD_OBJECTS_001_DIRECT_INPUT",
      environmentObjects: rawInput.objects.filter(isSupportedEnvironmentObject),
      biomeMetadataByObjectId,
      environmentClassificationByObjectId,
      natureAssetPack
    });
  }

  if (Array.isArray(rawInput?.naturalFeatureObjects)) {
    return deepFreeze({
      layerId: rawInput.layerId ?? "NATURE_ENVIRONMENT_DIRECT_INPUT",
      environmentObjects: rawInput.naturalFeatureObjects.map(normalizeEnvironmentObject),
      biomeMetadataByObjectId,
      environmentClassificationByObjectId,
      natureAssetPack
    });
  }

  throw createValidationError(
    "unsupported_nature_environment_input",
    "Nature environment recipe resolver requires classified world objects or direct natural feature input."
  );
}

function normalizeNatureAssetPack(rawNatureAssetPack) {
  const natureAssetPack = rawNatureAssetPack ?? createNatureAssetPack();
  const validation = validateNatureAssetPack(natureAssetPack);
  if (!validation.ok) {
    throw createValidationError("invalid_nature_asset_pack", validation.message);
  }
  return deepFreeze({
    schemaId: validation.natureAssetPack.schemaId,
    packId: validation.natureAssetPack.packId,
    assetFamilies: structuredClone(validation.natureAssetPack.assetFamilies),
    recipes: structuredClone(validation.natureAssetPack.recipes),
    assets: structuredClone(validation.natureAssetPack.assets),
    validation: structuredClone(validation.natureAssetPack.validation)
  });
}

function normalizeEnvironmentObject(rawObject) {
  const object = asPlainObject(rawObject, "environmentObject");
  return deepFreeze({
    objectId: normalizeNonEmptyString(object.objectId, "environmentObject.objectId"),
    realWorldType: normalizeNonEmptyString(
      object.realWorldType,
      "environmentObject.realWorldType"
    ),
    growgoClassification: normalizeNonEmptyString(
      object.growgoClassification ?? "NATURAL_FEATURE",
      "environmentObject.growgoClassification"
    ),
    gameplayTags: deepFreeze(
      normalizeOptionalStringArray(object.gameplayTags, "environmentObject.gameplayTags")
    )
  });
}

function buildNatureAssignment(environmentObject, normalizedInput, naturePack) {
  const environmentType = resolveEnvironmentType(environmentObject, normalizedInput);
  const recipeDefinition = environmentRecipeCatalog[environmentType];
  const selectedAssets = recipeDefinition.selectedAssets.map((selectedAsset) => {
    const assetRecord =
      naturePack.assets.find((asset) => asset.assetId === selectedAsset.assetId) ?? null;
    if (!assetRecord) {
      throw createValidationError(
        "missing_nature_asset",
        `Nature asset ${selectedAsset.assetId} is not registered in the nature asset pack.`
      );
    }

    return deepFreeze({
      assetId: assetRecord.assetId,
      assetFamily: assetRecord.assetFamily,
      role: selectedAsset.role,
      lodRules: assetRecord.lodRules
    });
  });

  return deepFreeze({
    objectId: environmentObject.objectId,
    environmentType,
    selectedAssets: deepFreeze(selectedAssets),
    recipeId: recipeDefinition.recipeId,
    biomeRules: recipeDefinition.biomeRules,
    lodRules: deepFreeze(uniqueSorted(selectedAssets.flatMap((asset) => asset.lodRules)))
  });
}

function resolveEnvironmentType(environmentObject, normalizedInput) {
  const explicitClassification =
    normalizedInput.environmentClassificationByObjectId[environmentObject.objectId] ?? null;
  if (explicitClassification) {
    const normalized = normalizeNonEmptyString(
      explicitClassification,
      "environmentClassification"
    ).toUpperCase();
    if (!supportedEnvironmentTypes.includes(normalized)) {
      throw createValidationError(
        "unsupported_environment_classification",
        `Environment classification ${normalized} is not supported.`
      );
    }
    return normalized;
  }

  const biomeRules = getBiomeRulesForObject(environmentObject.objectId, normalizedInput);
  if (environmentObject.realWorldType === "BEACH") {
    return "BEACH";
  }
  if (environmentObject.realWorldType === "FOREST") {
    return "FOREST";
  }
  if (
    (environmentObject.realWorldType === "PARK" ||
      environmentObject.realWorldType === "RESERVE") &&
    biomeRules.some((biomeRule) => ["COASTAL", "FORESHORE_PARKLAND"].includes(biomeRule))
  ) {
    return "COASTAL_PARK";
  }
  if (
    biomeRules.some((biomeRule) =>
      ["FOREST_EDGE", "TEMPERATE_FOREST_EDGE"].includes(biomeRule)
    )
  ) {
    return "FOREST";
  }
  return "SUBURBAN_GARDEN";
}

function buildNatureRecipeValidation(assignments, naturePack) {
  const assetMap = new Map(naturePack.assets.map((asset) => [asset.assetId, asset]));
  const assetsExist = assignments.every((assignment) =>
    assignment.selectedAssets.every((selectedAsset) => assetMap.has(selectedAsset.assetId))
  );
  const biomeCompatibilityValid = assignments.every((assignment) =>
    assignment.selectedAssets.every((selectedAsset) => {
      const asset = assetMap.get(selectedAsset.assetId);
      return assignment.biomeRules.some((biomeRule) =>
        asset.biomeCompatibility.includes(biomeRule)
      );
    })
  );
  const atlasCompatibilityValid = assignments.every((assignment) =>
    assignment.selectedAssets.every((selectedAsset) => {
      const asset = assetMap.get(selectedAsset.assetId);
      return asset.atlasCompatibility.atlasCompatible === true;
    })
  );
  const validationWithoutHash = deepFreeze({
    schemaId: natureRecipeValidationSchemaId,
    assetsExist,
    biomeCompatibilityValid,
    atlasCompatibilityValid,
    deterministicAssignment: true,
    validationPassed:
      assetsExist && biomeCompatibilityValid && atlasCompatibilityValid,
    deterministicSignatureHash: null
  });

  const signature = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      assignments: { entries: assignments },
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash: signature
  });
}

function buildValidationSignatureSource(resolver) {
  return {
    assignments: resolver.assignments.entries.map((entry) => ({
      objectId: entry.objectId,
      environmentType: entry.environmentType,
      recipeId: entry.recipeId,
      selectedAssets: entry.selectedAssets.map((selectedAsset) => selectedAsset.assetId),
      biomeRules: entry.biomeRules,
      lodRules: entry.lodRules
    })),
    validation: {
      assetsExist: resolver.validation.assetsExist,
      biomeCompatibilityValid: resolver.validation.biomeCompatibilityValid,
      atlasCompatibilityValid: resolver.validation.atlasCompatibilityValid,
      deterministicAssignment: resolver.validation.deterministicAssignment,
      validationPassed: resolver.validation.validationPassed
    }
  };
}

function getBiomeRulesForObject(objectId, normalizedInput) {
  const biomeRules = normalizedInput.biomeMetadataByObjectId[objectId];
  if (!biomeRules) {
    return [];
  }
  return normalizeOptionalStringArray(biomeRules, `biomeMetadataByObjectId.${objectId}`);
}

function isSupportedEnvironmentObject(object) {
  return (
    object &&
    typeof object.objectId === "string" &&
    ["PARK", "RESERVE", "BEACH", "FOREST", "WATERWAY"].includes(object.realWorldType) &&
    ["PARK", "NATURAL_FEATURE"].includes(object.growgoClassification)
  );
}

function createSelectedAssetDefinition(assetId, role) {
  return deepFreeze({
    assetId,
    role
  });
}

function normalizeObjectMap(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeOptionalStringArray(value, fieldName) {
  if (value === null || value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of strings.`
    );
  }
  return value.map((entry, index) =>
    normalizeNonEmptyString(entry, `${fieldName}[${index}]`).toUpperCase()
  );
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }
  return normalized;
}

function compareBy(key) {
  return (left, right) => String(left[key]).localeCompare(String(right[key]));
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function assertPresent(value, message) {
  if (value === null || value === undefined) {
    throw createValidationError("missing_required_value", message);
  }
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function computeDeterministicSignatureHash(value) {
  const stable = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}
