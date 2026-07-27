import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetCreationPipelineLayer } from "./asset-creation-pipeline.mjs";

export const assetCreationSpecificationLayerSchemaId =
  "ASSET_CREATION_SPECIFICATION_LAYER_001";
export const assetCreationSpecificationSchemaId = "ASSET_CREATION_SPECIFICATION_001";
export const assetCreationSpecificationValidationSchemaId =
  "ASSET_CREATION_SPECIFICATION_VALIDATION_001";

const firstPassSpecificationDefinitions = deepFreeze([
  specificationDefinition({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    environmentContext: {
      biome: "SUBURBAN_PARKLAND",
      climate: "TEMPERATE",
      regionProfile: "SUBURBAN_CITY_EDGE",
      environmentType: "RESIDENTIAL_AREA",
      styleProfile: "CLEAN_SUBURBAN"
    },
    performanceBudgetOverride: {
      polygonBudget: "medium",
      materialBudget: "shared_residential_material",
      instanceFriendly: true
    },
    specification: {
      style: "lightweight suburban detached house with clean papercut massing",
      materials: deepFreeze([
        "painted wall treatment",
        "suburban roof tile palette",
        "timber-or-simple-metal trim"
      ]),
      variants: deepFreeze(["suburban", "coastal", "rural"]),
      lodRequirements: deepFreeze([
        "LOD_CLOSE",
        "LOD_GAMEPLAY",
        "LOD_MAP"
      ]),
      performanceBudget: {
        polygonBudget: "medium",
        materialBudget: "shared_residential_material",
        instanceFriendly: true
      }
    }
  }),
  specificationDefinition({
    assetId: "BUILDING_COMMERCIAL_SMALL_SHOP_001",
    environmentContext: {
      biome: "TOWN_CENTRE",
      climate: "TEMPERATE",
      regionProfile: "REGIONAL_TOWN",
      environmentType: "MAIN_STREET",
      styleProfile: "MAIN_STREET_ACTIVE"
    },
    performanceBudgetOverride: {
      polygonBudget: "medium",
      materialBudget: "shared_commercial_material",
      instanceFriendly: true
    },
    specification: {
      shopStyle: "small-town shopfront with readable frontage and pedestrian-facing entry",
      frontageRules: deepFreeze([
        "clear front door",
        "window-led street presence",
        "sign-ready fascia band"
      ]),
      variants: deepFreeze(["town", "coastal", "urban"]),
      materials: deepFreeze([
        "painted shopfront panels",
        "glass frontage treatment",
        "shared awning-ready trim set"
      ])
    }
  }),
  specificationDefinition({
    assetId: "TREE_EUCALYPTUS_001",
    environmentContext: {
      biome: "FOREST_EDGE",
      climate: "TEMPERATE",
      regionProfile: "ALPINE_WORLD",
      environmentType: "FOREST",
      styleProfile: "NATURAL_LAYERED"
    },
    performanceBudgetOverride: {
      polygonBudget: "low",
      materialBudget: "shared_nature_material",
      instanceFriendly: true
    },
    specification: {
      biomeVariants: deepFreeze(["coastal", "urban", "forest"]),
      performanceBudget: {
        polygonBudget: "low",
        materialBudget: "shared_nature_material",
        instanceFriendly: true
      },
      lodRequirements: deepFreeze([
        "LOD_CLOSE",
        "LOD_GAMEPLAY",
        "LOD_MAP",
        "LOD_DISTANT_SILHOUETTE"
      ]),
      materials: deepFreeze([
        "shared foliage material",
        "simple trunk material",
        "high-contrast silhouette preservation"
      ])
    }
  }),
  specificationDefinition({
    assetId: "GROUND_BEACH_SAND_001",
    environmentContext: {
      biome: "COASTAL",
      climate: "MARITIME",
      regionProfile: "SMALL_COASTAL_TOWN",
      environmentType: "BEACH_EDGE_PREVIEW",
      styleProfile: "PAPERCUT_COASTAL"
    },
    specification: {
      coastalCompatibility: deepFreeze([
        "COASTAL",
        "BEACH_EDGE",
        "DUNE_SYSTEM"
      ]),
      materialRules: deepFreeze([
        "shared sand base material",
        "dune-safe tonal variation only",
        "shoreline-friendly low-detail layering"
      ]),
      variants: deepFreeze(["base"]),
      lodRequirements: deepFreeze([
        "LOD_CLOSE",
        "LOD_GAMEPLAY",
        "LOD_MAP",
        "LOD_DISTANT_SILHOUETTE"
      ])
    }
  }),
  specificationDefinition({
    assetId: "BUILDING_CIVIC_SCHOOL_PRIMARY_001",
    specificationLabel: "BUILDING_CIVIC_SCHOOL_001",
    environmentContext: {
      biome: "SUBURBAN_PARKLAND",
      climate: "TEMPERATE",
      regionProfile: "REGIONAL_TOWN",
      environmentType: "CIVIC_CAMPUS",
      styleProfile: "PAPERCUT_STANDARD"
    },
    performanceBudgetOverride: {
      polygonBudget: "medium",
      materialBudget: "shared_civic_material",
      instanceFriendly: false
    },
    specification: {
      footprintCompatibility: deepFreeze([
        "CAMPUS_FOOTPRINT",
        "SUBURBAN_BLOCK_EDGE",
        "CORNER_LOT_CIVIC"
      ]),
      civicUsage: deepFreeze([
        "community anchor",
        "school drop-off visibility",
        "playground-ready campus edge"
      ]),
      variants: deepFreeze(["primary_school", "secondary_school", "small_rural_school"]),
      materials: deepFreeze([
        "shared civic wall palette",
        "durable roof treatment",
        "clear campus entry accents"
      ])
    }
  })
]);

export function createAssetCreationSpecificationLayer(
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawPipeline = createAssetCreationPipelineLayer(rawRegistry)
) {
  const registry = normalizeRegistry(rawRegistry);
  const pipeline = normalizePipeline(rawPipeline);

  const specifications = deepFreeze(
    firstPassSpecificationDefinitions
      .map((definition) => buildSpecification(definition, registry, pipeline))
      .sort((left, right) => left.assetId.localeCompare(right.assetId))
  );

  const validation = buildSpecificationLayerValidation(specifications, registry);
  const specificationMap = new Map(specifications.map((entry) => [entry.assetId, entry]));

  const layer = deepFreeze({
    schemaId: assetCreationSpecificationLayerSchemaId,
    layerId: "ASSET_CREATION_SPECIFICATION_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    pipelineId: pipeline.layerId,
    specifications,
    validation,
    getSpecificationByAssetId(assetId) {
      return specificationMap.get(normalizeStringValue(assetId, "assetId")) ?? null;
    }
  });

  const checked = validateAssetCreationSpecificationLayer(layer);
  if (!checked.ok) {
    throw createSpecificationValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function createAssetCreationSpecification(
  rawInput,
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawPipeline = createAssetCreationPipelineLayer(rawRegistry)
) {
  const definition = resolveSpecificationDefinition(rawInput);
  const registry = normalizeRegistry(rawRegistry);
  const pipeline = normalizePipeline(rawPipeline);
  const specification = buildSpecification(definition, registry, pipeline);
  const checked = validateAssetCreationSpecification(specification);
  if (!checked.ok) {
    throw createSpecificationValidationError(checked.errorCode, checked.message);
  }
  return specification;
}

export function validateAssetCreationSpecificationLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetCreationSpecificationLayerSchemaId) {
      throw createSpecificationValidationError(
        "invalid_asset_creation_specification_layer_schema",
        `Expected ${assetCreationSpecificationLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.specifications) || rawLayer.specifications.length === 0) {
      throw createSpecificationValidationError(
        "invalid_asset_creation_specifications",
        "Asset creation specification layer must expose a non-empty specifications array."
      );
    }

    if (rawLayer.validation?.schemaId !== assetCreationSpecificationValidationSchemaId) {
      throw createSpecificationValidationError(
        "invalid_asset_creation_specification_validation_schema",
        `Expected ${assetCreationSpecificationValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "assetRegistered",
      "recipeExists",
      "specificationComplete",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createSpecificationValidationError(
          "asset_creation_specification_layer_validation_failed",
          `Asset creation specification validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(
      rawLayer.specifications.map((entry) => buildSpecificationSignature(entry))
    );
    if (expectedHash !== rawLayer.validation.deterministicSpecificationHash) {
      throw createSpecificationValidationError(
        "asset_creation_specification_layer_hash_mismatch",
        "Asset creation specification layer hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetCreationSpecificationLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_creation_specification_layer_validation_failed",
      message: error.message,
      assetCreationSpecificationLayer: null
    });
  }
}

export function validateAssetCreationSpecification(rawSpecification) {
  try {
    if (rawSpecification?.schemaId !== assetCreationSpecificationSchemaId) {
      throw createSpecificationValidationError(
        "invalid_asset_creation_specification_schema",
        `Expected ${assetCreationSpecificationSchemaId} but received ${rawSpecification?.schemaId}.`
      );
    }

    if (rawSpecification.validation?.schemaId !== assetCreationSpecificationValidationSchemaId) {
      throw createSpecificationValidationError(
        "invalid_asset_creation_specification_validation_schema",
        `Expected ${assetCreationSpecificationValidationSchemaId} but received ${rawSpecification.validation?.schemaId}.`
      );
    }

    for (const key of [
      "assetRegistered",
      "recipeExists",
      "specificationComplete",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawSpecification.validation[key] !== true) {
        throw createSpecificationValidationError(
          "asset_creation_specification_validation_failed",
          `Asset creation specification validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildSpecificationSignature(rawSpecification));
    if (expectedHash !== rawSpecification.validation.deterministicSpecificationHash) {
      throw createSpecificationValidationError(
        "asset_creation_specification_hash_mismatch",
        "Asset creation specification hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetCreationSpecification: rawSpecification
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_creation_specification_validation_failed",
      message: error.message,
      assetCreationSpecification: null
    });
  }
}

function buildSpecification(definition, registry, pipeline) {
  const registeredAsset = registry.getAssetById(definition.assetId);
  if (!registeredAsset) {
    throw createSpecificationValidationError(
      "missing_asset_creation_specification_asset",
      `Asset ${definition.assetId} is not registered and cannot be specified.`
    );
  }

  const approvedRequest = createApprovedRequest(definition, pipeline);
  const normalizedDefinition = normalizeSpecificationBody(definition.specification);
  const resolvedPerformanceBudget =
    approvedRequest.performanceBudget ?? normalizePerformanceBudget(definition.performanceBudgetOverride);

  const specificationBase = deepFreeze({
    schemaId: assetCreationSpecificationSchemaId,
    specificationId: buildSpecificationId(definition),
    specificationLabel: definition.specificationLabel ?? definition.assetId,
    assetId: registeredAsset.assetId,
    recipeId: approvedRequest.recipeId,
    selectedVariant: approvedRequest.selectedVariant,
    variants: collectVariants(definition, approvedRequest),
    lodRequirements: deepFreeze([...approvedRequest.lodRequirements]),
    performanceBudget: resolvedPerformanceBudget,
    creationRequest: approvedRequest,
    specification: normalizedDefinition,
    metadata: deepFreeze({
      registrySourceAssetId: registeredAsset.assetId,
      pipelineRequestId: approvedRequest.requestId,
      assumption:
        definition.specificationLabel && definition.specificationLabel !== definition.assetId
          ? `Requested label ${definition.specificationLabel} mapped to registered asset ${definition.assetId}.`
          : null
    }),
    validation: null
  });

  const validation = buildSpecificationValidation(specificationBase, registry);
  return deepFreeze({
    ...specificationBase,
    validation
  });
}

function createApprovedRequest(definition, pipeline) {
  let request = pipeline.createRequest({
    baseAssetId: definition.assetId,
    environmentContext: definition.environmentContext,
    performanceBudgetOverride: definition.performanceBudgetOverride
  });

  request = pipeline.advanceRequest(request, "IN_PROGRESS");
  request = pipeline.advanceRequest(request, "VALIDATION_PENDING");
  request = pipeline.advanceRequest(request, "APPROVED");

  return request;
}

function buildSpecificationValidation(specification, registry) {
  const assetRegistered = registry.getAssetById(specification.assetId) !== null;
  const recipeExists =
    assetRegistered && registry.getAssetById(specification.assetId).recipeId === specification.recipeId;
  const specificationComplete = isSpecificationComplete(specification);
  const deterministicOutput = true;
  const validationPassed =
    assetRegistered && recipeExists && specificationComplete && deterministicOutput;

  return deepFreeze({
    schemaId: assetCreationSpecificationValidationSchemaId,
    assetRegistered,
    recipeExists,
    specificationComplete,
    deterministicOutput,
    validationPassed,
    deterministicSpecificationHash: computeDeterministicHash(
      buildSpecificationSignature(specification)
    )
  });
}

function buildSpecificationLayerValidation(specifications, registry) {
  const assetRegistered = specifications.every(
    (entry) => registry.getAssetById(entry.assetId) !== null
  );
  const recipeExists = specifications.every(
    (entry) => registry.getAssetById(entry.assetId)?.recipeId === entry.recipeId
  );
  const specificationComplete = specifications.every((entry) => isSpecificationComplete(entry));
  const deterministicOutput = true;
  const validationPassed =
    assetRegistered && recipeExists && specificationComplete && deterministicOutput;

  return deepFreeze({
    schemaId: assetCreationSpecificationValidationSchemaId,
    assetRegistered,
    recipeExists,
    specificationComplete,
    deterministicOutput,
    validationPassed,
    deterministicSpecificationHash: computeDeterministicHash(
      specifications.map((entry) => buildSpecificationSignature(entry))
    )
  });
}

function buildSpecificationSignature(specification) {
  return [
    specification.specificationId,
    specification.assetId,
    specification.recipeId,
    specification.selectedVariant,
    specification.variants,
    specification.lodRequirements,
    specification.performanceBudget,
    specification.specification
  ];
}

function resolveSpecificationDefinition(rawInput) {
  const input = asPlainObject(rawInput, "assetCreationSpecificationInput");
  const assetId = normalizeStringValue(input.assetId, "assetId");
  const definition = firstPassSpecificationDefinitions.find((entry) => entry.assetId === assetId);

  if (!definition) {
    throw createSpecificationValidationError(
      "missing_asset_creation_specification_definition",
      `No first-pass specification definition exists for asset ${assetId}.`
    );
  }

  return definition;
}

function collectVariants(definition, approvedRequest) {
  const rawVariants =
    definition.specification.variants ??
    definition.specification.biomeVariants ??
    [approvedRequest.selectedVariant];
  return deepFreeze([...rawVariants]);
}

function isSpecificationComplete(specification) {
  return (
    typeof specification.assetId === "string" &&
    typeof specification.recipeId === "string" &&
    Array.isArray(specification.variants) &&
    specification.variants.length > 0 &&
    Array.isArray(specification.lodRequirements) &&
    specification.lodRequirements.length > 0 &&
    Boolean(specification.performanceBudget) &&
    specification.creationRequest?.state === "APPROVED" &&
    Object.keys(specification.specification).length > 0
  );
}

function specificationDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "specificationDefinition");
  return deepFreeze({
    assetId: normalizeStringValue(definition.assetId, "assetId"),
    specificationLabel: definition.specificationLabel
      ? normalizeStringValue(definition.specificationLabel, "specificationLabel")
      : null,
    environmentContext: normalizeEnvironmentContext(definition.environmentContext),
    performanceBudgetOverride: definition.performanceBudgetOverride
      ? normalizePerformanceBudget(definition.performanceBudgetOverride)
      : null,
    specification: normalizeSpecificationBody(definition.specification)
  });
}

function normalizeSpecificationBody(rawSpecification) {
  const specification = asPlainObject(rawSpecification, "specification");
  return deepFreeze({
    ...sortKeys(specification)
  });
}

function normalizeRegistry(rawRegistry) {
  if (
    !rawRegistry ||
    rawRegistry.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001" ||
    typeof rawRegistry.getAssetById !== "function"
  ) {
    throw createSpecificationValidationError(
      "invalid_asset_creation_specification_registry",
      "Asset creation specification layer requires a valid Asset Factory registry layer."
    );
  }

  return rawRegistry;
}

function normalizePipeline(rawPipeline) {
  if (
    !rawPipeline ||
    rawPipeline.schemaId !== "ASSET_CREATION_PIPELINE_LAYER_001" ||
    typeof rawPipeline.createRequest !== "function" ||
    typeof rawPipeline.advanceRequest !== "function"
  ) {
    throw createSpecificationValidationError(
      "invalid_asset_creation_specification_pipeline",
      "Asset creation specification layer requires a valid asset creation pipeline."
    );
  }

  return rawPipeline;
}

function normalizeEnvironmentContext(rawContext) {
  const context = asPlainObject(rawContext ?? {}, "environmentContext");
  return deepFreeze({
    biome: isPresent(context.biome) ? normalizeStringValue(context.biome, "environmentContext.biome") : "GENERIC",
    climate: isPresent(context.climate)
      ? normalizeStringValue(context.climate, "environmentContext.climate")
      : "GENERIC",
    regionProfile: isPresent(context.regionProfile)
      ? normalizeStringValue(context.regionProfile, "environmentContext.regionProfile")
      : "GENERIC",
    environmentType: isPresent(context.environmentType)
      ? normalizeStringValue(context.environmentType, "environmentContext.environmentType")
      : "GENERIC",
    styleProfile: isPresent(context.styleProfile)
      ? normalizeStringValue(context.styleProfile, "environmentContext.styleProfile")
      : "GENERIC"
  });
}

function normalizePerformanceBudget(rawBudget) {
  if (!rawBudget) {
    return null;
  }

  const budget = asPlainObject(rawBudget, "performanceBudget");
  return deepFreeze({
    polygonBudget: normalizeStringValue(budget.polygonBudget, "performanceBudget.polygonBudget"),
    materialBudget: normalizeStringValue(
      budget.materialBudget,
      "performanceBudget.materialBudget"
    ),
    instanceFriendly: normalizeBoolean(
      budget.instanceFriendly,
      "performanceBudget.instanceFriendly"
    )
  });
}

function buildSpecificationId(definition) {
  return `ASSET_CREATION_SPEC_${normalizeSlug(definition.specificationLabel ?? definition.assetId)}`;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createSpecificationValidationError(
      "invalid_asset_creation_specification_string",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createSpecificationValidationError(
      "invalid_asset_creation_specification_boolean",
      `Field ${fieldName} must be a boolean.`
    );
  }
  return value;
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
  return `SPEC_${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
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

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createSpecificationValidationError(
      "invalid_asset_creation_specification_object",
      `Field ${fieldName} must be an object.`
    );
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

function createSpecificationValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetCreationSpecificationValidationError";
  error.code = code;
  return error;
}
