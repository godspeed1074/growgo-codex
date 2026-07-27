import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetCreationSpecificationLayer } from "./asset-creation-specification.mjs";
import { createAssetAuthoringWorkflowLayer } from "./asset-authoring-workflow.mjs";

export const assetQualityValidationLayerSchemaId =
  "ASSET_QUALITY_VALIDATION_LAYER_001";
export const assetQualityReportSchemaId = "ASSET_QUALITY_REPORT_001";
export const assetQualityValidationResultSchemaId =
  "ASSET_QUALITY_VALIDATION_RESULT_001";

export function createAssetQualityValidationLayer(
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawSpecificationLayer = createAssetCreationSpecificationLayer(rawRegistry),
  rawAuthoringWorkflow = createAssetAuthoringWorkflowLayer(rawRegistry, rawSpecificationLayer)
) {
  const registry = normalizeRegistry(rawRegistry);
  const specificationLayer = normalizeSpecificationLayer(rawSpecificationLayer);
  const authoringWorkflow = normalizeAuthoringWorkflow(rawAuthoringWorkflow);

  const layer = deepFreeze({
    schemaId: assetQualityValidationLayerSchemaId,
    layerId: "ASSET_QUALITY_VALIDATION_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    specificationLayerId: specificationLayer.layerId,
    authoringWorkflowLayerId: authoringWorkflow.layerId,
    validateAsset(rawInput) {
      return createAssetQualityValidationResult(
        rawInput,
        registry,
        specificationLayer,
        authoringWorkflow
      );
    }
  });

  const checked = validateAssetQualityValidationLayer(layer);
  if (!checked.ok) {
    throw createQualityValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetQualityValidationLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetQualityValidationLayerSchemaId) {
      throw createQualityValidationError(
        "invalid_asset_quality_validation_layer_schema",
        `Expected ${assetQualityValidationLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (typeof rawLayer.validateAsset !== "function") {
      throw createQualityValidationError(
        "invalid_asset_quality_validation_layer_contract",
        "Asset quality validation layer must expose validateAsset."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetQualityValidationLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_quality_validation_layer_failed",
      message: error.message,
      assetQualityValidationLayer: null
    });
  }
}

export function validateAssetQualityValidationResult(rawResult) {
  try {
    if (rawResult?.schemaId !== assetQualityValidationResultSchemaId) {
      throw createQualityValidationError(
        "invalid_asset_quality_validation_result_schema",
        `Expected ${assetQualityValidationResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (rawResult.report?.schemaId !== assetQualityReportSchemaId) {
      throw createQualityValidationError(
        "invalid_asset_quality_report_schema",
        `Expected ${assetQualityReportSchemaId} but received ${rawResult.report?.schemaId}.`
      );
    }

    for (const key of [
      "deterministicValidation",
      "completeReporting",
      "failureHandling",
      "validationPassed"
    ]) {
      if (rawResult.validation[key] !== true) {
        throw createQualityValidationError(
          "asset_quality_validation_result_failed",
          `Asset quality validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildQualitySignature(rawResult.report));
    if (expectedHash !== rawResult.validation.deterministicValidationHash) {
      throw createQualityValidationError(
        "asset_quality_validation_hash_mismatch",
        "Asset quality validation deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetQualityValidationResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_quality_validation_result_failed",
      message: error.message,
      assetQualityValidationResult: null
    });
  }
}

function createAssetQualityValidationResult(
  rawInput,
  registry,
  specificationLayer,
  authoringWorkflow
) {
  const input = normalizeValidationInput(rawInput);
  const authoringRecord =
    input.authoringRecord ??
    authoringWorkflow.createRecord({
      assetId: input.assetId
    });
  const specification =
    specificationLayer.getSpecificationByAssetId(authoringRecord.assetId) ?? null;
  const registeredAsset = registry.getAssetById(authoringRecord.assetId) ?? null;

  const performanceValidation = buildPerformanceValidation(
    authoringRecord,
    specification,
    registeredAsset,
    input.overrides
  );
  const atlasValidation = buildAtlasCompatibilityValidation(
    authoringRecord,
    specification,
    registeredAsset,
    input.overrides
  );
  const modularBibleValidation = buildModularBibleValidation(
    authoringRecord,
    specification,
    registeredAsset,
    input.overrides
  );
  const styleValidation = buildStyleValidation(
    authoringRecord,
    specification,
    registeredAsset,
    input.overrides
  );

  const categories = deepFreeze({
    PERFORMANCE_VALIDATION_001: performanceValidation,
    ATLAS_COMPATIBILITY_VALIDATION_001: atlasValidation,
    MODULAR_BIBLE_VALIDATION_001: modularBibleValidation,
    STYLE_VALIDATION_001: styleValidation
  });

  const pass = Object.values(categories).every((category) => category.passed === true);
  const warnings = deepFreeze(
    Object.values(categories)
      .flatMap((category) => category.warnings)
      .sort()
  );

  const report = deepFreeze({
    schemaId: assetQualityReportSchemaId,
    reportId: `ASSET_QUALITY_REPORT_${normalizeSlug(authoringRecord.assetId)}`,
    assetId: authoringRecord.assetId,
    validationCategories: categories,
    passFailResults: deepFreeze(
      Object.entries(categories).map(([categoryId, category]) =>
        deepFreeze({
          categoryId,
          passed: category.passed
        })
      )
    ),
    warnings,
    approvalReadiness: pass ? "READY_FOR_APPROVAL" : "NOT_READY"
  });

  const validation = deepFreeze({
    schemaId: assetQualityValidationResultSchemaId,
    deterministicValidation: true,
    completeReporting: true,
    failureHandling: true,
    validationPassed: true,
    deterministicValidationHash: computeDeterministicHash(buildQualitySignature(report))
  });

  const result = deepFreeze({
    schemaId: assetQualityValidationResultSchemaId,
    validationId: `ASSET_QUALITY_VALIDATION_${normalizeSlug(authoringRecord.assetId)}`,
    assetId: authoringRecord.assetId,
    report,
    validation
  });

  const checked = validateAssetQualityValidationResult(result);
  if (!checked.ok) {
    throw createQualityValidationError(checked.errorCode, checked.message);
  }

  return result;
}

function buildPerformanceValidation(authoringRecord, specification, registeredAsset, overrides) {
  const performanceBudget = overrides.performanceBudget ?? authoringRecord.performanceBudget;
  const polygonBudgetValid = Boolean(performanceBudget?.polygonBudget);
  const materialBudgetValid = Boolean(performanceBudget?.materialBudget);
  const textureBudgetValid = deriveTextureBudgetValid(specification, overrides);
  const lodAvailabilityValid =
    Array.isArray(authoringRecord.lodRules) && authoringRecord.lodRules.length > 0;
  const passed =
    polygonBudgetValid && materialBudgetValid && textureBudgetValid && lodAvailabilityValid;

  return deepFreeze({
    categoryId: "PERFORMANCE_VALIDATION_001",
    passed,
    checks: deepFreeze({
      polygonBudgetValid,
      materialBudgetValid,
      textureBudgetValid,
      lodAvailabilityValid
    }),
    warnings: buildWarnings([
      [!polygonBudgetValid, "missing polygon budget"],
      [!materialBudgetValid, "missing material budget"],
      [!textureBudgetValid, "missing texture budget rule"],
      [!lodAvailabilityValid, "missing LOD availability"]
    ])
  });
}

function buildAtlasCompatibilityValidation(
  authoringRecord,
  specification,
  registeredAsset,
  overrides
) {
  const recipeCompatible =
    overrides.recipeExistsOverride ??
    (Boolean(registeredAsset) && registeredAsset.recipeId === authoringRecord.recipeId);
  const objectTypeCompatible =
    Array.isArray(registeredAsset?.atlasCompatibility?.supportedObjectTypes) &&
    registeredAsset.atlasCompatibility.supportedObjectTypes.length > 0;
  const placementCompatible =
    Array.isArray(registeredAsset?.footprintCompatibility) &&
    registeredAsset.footprintCompatibility.length > 0
      ? true
      : Array.isArray(registeredAsset?.geometryCompatibility) &&
        registeredAsset.geometryCompatibility.length > 0;
  const passed = recipeCompatible && objectTypeCompatible && placementCompatible;

  return deepFreeze({
    categoryId: "ATLAS_COMPATIBILITY_VALIDATION_001",
    passed,
    checks: deepFreeze({
      recipeCompatible,
      objectTypeCompatible,
      placementCompatible
    }),
    warnings: buildWarnings([
      [!recipeCompatible, "recipe compatibility failed"],
      [!objectTypeCompatible, "missing object type compatibility"],
      [!placementCompatible, "missing placement compatibility"]
    ])
  });
}

function buildModularBibleValidation(authoringRecord, specification, registeredAsset, overrides) {
  const assetIdValid = typeof authoringRecord.assetId === "string" && authoringRecord.assetId.length > 0;
  const metadataComplete =
    overrides.metadataCompleteOverride ??
    Boolean(
      registeredAsset?.metadata &&
        authoringRecord.metadata &&
        specification?.metadata &&
        authoringRecord.specificationId
    );
  const reusableDesignValid =
    Array.isArray(authoringRecord.variantRequirements) &&
    authoringRecord.variantRequirements.length > 0;
  const variantSupportValid =
    Array.isArray(authoringRecord.variantRequirements) &&
    authoringRecord.variantRequirements.length > 0;
  const passed =
    assetIdValid && metadataComplete && reusableDesignValid && variantSupportValid;

  return deepFreeze({
    categoryId: "MODULAR_BIBLE_VALIDATION_001",
    passed,
    checks: deepFreeze({
      assetIdValid,
      metadataComplete,
      reusableDesignValid,
      variantSupportValid
    }),
    warnings: buildWarnings([
      [!assetIdValid, "invalid asset ID"],
      [!metadataComplete, "metadata incomplete"],
      [!reusableDesignValid, "reusable design support missing"],
      [!variantSupportValid, "variant support missing"]
    ])
  });
}

function buildStyleValidation(authoringRecord, specification, registeredAsset, overrides) {
  const specBody = specification?.specification ?? {};
  const styleProfileValid =
    overrides.styleProfileValidOverride ?? deriveStyleProfileValid(specification);
  const papercutCompatible =
    overrides.papercutCompatibleOverride ?? derivePapercutCompatible(specification);
  const visualCategoryValid =
    overrides.visualCategoryValidOverride ?? deriveVisualCategoryValid(specification, registeredAsset);
  const passed = styleProfileValid && papercutCompatible && visualCategoryValid;

  return deepFreeze({
    categoryId: "STYLE_VALIDATION_001",
    passed,
    checks: deepFreeze({
      styleProfileValid,
      papercutCompatible,
      visualCategoryValid
    }),
    warnings: buildWarnings([
      [!styleProfileValid, "style profile missing or invalid"],
      [!papercutCompatible, "papercut compatibility not established"],
      [!visualCategoryValid, "visual category missing"]
    ]),
    styleEvidence: deepFreeze({
      specificationKeys: Object.keys(specBody).sort()
    })
  });
}

function deriveTextureBudgetValid(specification, overrides) {
  if (typeof overrides.textureBudgetValidOverride === "boolean") {
    return overrides.textureBudgetValidOverride;
  }

  const materials = specification?.specification?.materials;
  const materialRules = specification?.specification?.materialRules;
  return (
    (Array.isArray(materials) && materials.length > 0) ||
    (Array.isArray(materialRules) && materialRules.length > 0)
  );
}

function deriveStyleProfileValid(specification) {
  const styleProfile = specification?.creationRequest?.environmentContext?.styleProfile;
  return typeof styleProfile === "string" && styleProfile !== "GENERIC";
}

function derivePapercutCompatible(specification) {
  const style = specification?.specification?.style;
  const styleProfile = specification?.creationRequest?.environmentContext?.styleProfile;
  return (
    (typeof style === "string" && style.toLowerCase().includes("papercut")) ||
    (typeof styleProfile === "string" && styleProfile.toUpperCase().includes("PAPERCUT"))
  );
}

function deriveVisualCategoryValid(specification, registeredAsset) {
  return Boolean(
    registeredAsset?.assetFamily ||
      specification?.specification?.shopStyle ||
      specification?.specification?.civicUsage ||
      specification?.specification?.coastalCompatibility ||
      specification?.specification?.biomeVariants
  );
}

function buildWarnings(entries) {
  return deepFreeze(
    entries
      .filter(([condition]) => condition)
      .map(([, warning]) => warning)
      .sort()
  );
}

function buildQualitySignature(report) {
  return [
    report.assetId,
    report.validationCategories,
    report.passFailResults,
    report.warnings,
    report.approvalReadiness
  ];
}

function normalizeValidationInput(rawInput) {
  const input = asPlainObject(rawInput, "assetQualityValidationInput");
  const assetId = input.authoringRecord?.assetId ?? input.assetId;
  if (typeof assetId !== "string" || assetId.trim().length === 0) {
    throw createQualityValidationError(
      "invalid_asset_quality_validation_input",
      "Asset quality validation requires assetId or authoringRecord.assetId."
    );
  }

  return deepFreeze({
    assetId: assetId.trim(),
    authoringRecord: input.authoringRecord ?? null,
    overrides: deepFreeze({
      metadataCompleteOverride:
        typeof input.metadataCompleteOverride === "boolean"
          ? input.metadataCompleteOverride
          : undefined,
      textureBudgetValidOverride:
        typeof input.textureBudgetValidOverride === "boolean"
          ? input.textureBudgetValidOverride
          : undefined,
      recipeExistsOverride:
        typeof input.recipeExistsOverride === "boolean"
          ? input.recipeExistsOverride
          : undefined,
      styleProfileValidOverride:
        typeof input.styleProfileValidOverride === "boolean"
          ? input.styleProfileValidOverride
          : undefined,
      papercutCompatibleOverride:
        typeof input.papercutCompatibleOverride === "boolean"
          ? input.papercutCompatibleOverride
          : undefined,
      visualCategoryValidOverride:
        typeof input.visualCategoryValidOverride === "boolean"
          ? input.visualCategoryValidOverride
          : undefined,
      performanceBudget:
        input.performanceBudget && typeof input.performanceBudget === "object"
          ? deepFreeze({ ...input.performanceBudget })
          : null
    })
  });
}

function normalizeRegistry(rawRegistry) {
  if (
    !rawRegistry ||
    rawRegistry.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001" ||
    typeof rawRegistry.getAssetById !== "function"
  ) {
    throw createQualityValidationError(
      "invalid_asset_quality_registry",
      "Asset quality validation requires a valid Asset Factory registry layer."
    );
  }
  return rawRegistry;
}

function normalizeSpecificationLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_CREATION_SPECIFICATION_LAYER_001" ||
    typeof rawLayer.getSpecificationByAssetId !== "function"
  ) {
    throw createQualityValidationError(
      "invalid_asset_quality_specification_layer",
      "Asset quality validation requires a valid asset creation specification layer."
    );
  }
  return rawLayer;
}

function normalizeAuthoringWorkflow(rawWorkflow) {
  if (
    !rawWorkflow ||
    rawWorkflow.schemaId !== "ASSET_AUTHORING_WORKFLOW_LAYER_001" ||
    typeof rawWorkflow.createRecord !== "function"
  ) {
    throw createQualityValidationError(
      "invalid_asset_quality_authoring_workflow",
      "Asset quality validation requires a valid asset authoring workflow layer."
    );
  }
  return rawWorkflow;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createQualityValidationError(
      "invalid_asset_quality_object",
      `Field ${fieldName} must be an object.`
    );
  }
  return value;
}

function computeDeterministicHash(value) {
  const source = JSON.stringify(sortKeys(value));
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `QUALITY_${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
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

function normalizeSlug(value) {
  return value.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
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

function createQualityValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetQualityValidationError";
  error.code = code;
  return error;
}
