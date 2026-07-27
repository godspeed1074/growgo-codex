import { createHash } from "node:crypto";

import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetVariantSystem } from "./asset-variant-system.mjs";
import { createAssetCreationSpecificationLayer } from "./asset-creation-specification.mjs";
import { createAssetQualityValidationLayer } from "./asset-quality-validation.mjs";

export const assetVariantComparisonLayerSchemaId =
  "ASSET_VARIANT_COMPARISON_LAYER_001";
export const assetVariantComparisonRecordSchemaId =
  "ASSET_VARIANT_COMPARISON_RECORD_001";
export const assetVariantComparisonValidationSchemaId =
  "ASSET_VARIANT_COMPARISON_VALIDATION_001";

const defaultBaseAssetId = "BUILDING_RESIDENTIAL_SUBURBAN_001";

const defaultComparisonScenarios = deepFreeze([
  deepFreeze({
    comparisonLabel: "SUBURBAN_REFERENCE",
    environmentContext: deepFreeze({
      biome: "SUBURBAN_PARKLAND",
      climate: "TEMPERATE",
      regionProfile: "SUBURBAN_CITY_EDGE",
      environmentType: "RESIDENTIAL_AREA",
      styleProfile: "CLEAN_SUBURBAN"
    })
  }),
  deepFreeze({
    comparisonLabel: "COASTAL_VARIANT",
    environmentContext: deepFreeze({
      biome: "COASTAL",
      climate: "MARITIME",
      regionProfile: "SMALL_COASTAL_TOWN",
      environmentType: "RESIDENTIAL_COASTAL",
      styleProfile: "PAPERCUT_COASTAL"
    })
  }),
  deepFreeze({
    comparisonLabel: "RURAL_VARIANT",
    environmentContext: deepFreeze({
      biome: "FARMLAND",
      climate: "DRY_TEMPERATE",
      regionProfile: "REGIONAL_TOWN",
      environmentType: "RURAL_RESIDENTIAL",
      styleProfile: "QUIET_RURAL"
    })
  })
]);

export function createAssetVariantComparisonLayer(
  rawOptions = {},
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawVariantSystem = createAssetVariantSystem(rawRegistry),
  rawSpecificationLayer = createAssetCreationSpecificationLayer(rawRegistry),
  rawQualityLayer = createAssetQualityValidationLayer(rawRegistry, rawSpecificationLayer)
) {
  const options = normalizeOptions(rawOptions);
  const registry = normalizeRegistry(rawRegistry);
  const variantSystem = normalizeVariantSystem(rawVariantSystem);
  const specificationLayer = normalizeSpecificationLayer(rawSpecificationLayer);
  const qualityLayer = normalizeQualityLayer(rawQualityLayer);

  const record = createAssetVariantComparisonRecord(
    options,
    registry,
    variantSystem,
    specificationLayer,
    qualityLayer
  );
  const validation = buildVariantComparisonValidation(record, registry);

  const layer = deepFreeze({
    schemaId: assetVariantComparisonLayerSchemaId,
    layerId: "ASSET_VARIANT_COMPARISON_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    variantSystemId: variantSystem.systemId,
    specificationLayerId: specificationLayer.layerId,
    qualityLayerId: qualityLayer.layerId,
    comparisonRecord: record,
    validation,
    createComparisonRecord(rawInput = {}) {
      return createAssetVariantComparisonRecord(
        normalizeOptions({
          baseAssetId: rawInput.baseAssetId ?? options.baseAssetId,
          previewRecord: rawInput.previewRecord ?? null,
          variantAssignments: rawInput.variantAssignments ?? null
        }),
        registry,
        variantSystem,
        specificationLayer,
        qualityLayer
      );
    }
  });

  const checked = validateAssetVariantComparisonLayer(layer);
  if (!checked.ok) {
    throw createVariantComparisonError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetVariantComparisonLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetVariantComparisonLayerSchemaId) {
      throw createVariantComparisonError(
        "invalid_asset_variant_comparison_layer_schema",
        `Expected ${assetVariantComparisonLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.comparisonRecord?.schemaId !== assetVariantComparisonRecordSchemaId) {
      throw createVariantComparisonError(
        "invalid_asset_variant_comparison_record_schema",
        `Expected ${assetVariantComparisonRecordSchemaId} but received ${rawLayer.comparisonRecord?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetVariantComparisonValidationSchemaId) {
      throw createVariantComparisonError(
        "invalid_asset_variant_comparison_validation_schema",
        `Expected ${assetVariantComparisonValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "variantsBelongToAsset",
      "comparisonDataComplete",
      "deterministicRecommendation",
      "noApprovalBypass",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createVariantComparisonError(
          "asset_variant_comparison_layer_validation_failed",
          `Asset variant comparison validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetVariantComparisonLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_variant_comparison_layer_validation_failed",
      message: error.message,
      assetVariantComparisonLayer: null
    });
  }
}

export function validateAssetVariantComparisonRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetVariantComparisonRecordSchemaId) {
      throw createVariantComparisonError(
        "invalid_asset_variant_comparison_record_schema",
        `Expected ${assetVariantComparisonRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetVariantComparisonValidationSchemaId) {
      throw createVariantComparisonError(
        "invalid_asset_variant_comparison_validation_schema",
        `Expected ${assetVariantComparisonValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    const derivedValidation = buildVariantComparisonValidation(
      rawRecord,
      createAssetFactoryRegistryLayer()
    );

    for (const key of [
      "variantsBelongToAsset",
      "comparisonDataComplete",
      "deterministicRecommendation",
      "noApprovalBypass",
      "validationPassed"
    ]) {
      if (derivedValidation[key] !== true) {
        throw createVariantComparisonError(
          "asset_variant_comparison_record_validation_failed",
          `Asset variant comparison validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildComparisonSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicComparisonHash) {
      throw createVariantComparisonError(
        "asset_variant_comparison_hash_mismatch",
        "Asset variant comparison record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetVariantComparisonRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_variant_comparison_record_validation_failed",
      message: error.message,
      assetVariantComparisonRecord: null
    });
  }
}

function createAssetVariantComparisonRecord(
  options,
  registry,
  variantSystem,
  specificationLayer,
  qualityLayer
) {
  const previewRecord =
    options.previewRecord ??
    buildSyntheticPreviewRecord(options.baseAssetId, registry, specificationLayer, qualityLayer);
  const variantAssignments =
    options.variantAssignments ??
    defaultComparisonScenarios.map((scenario) =>
      variantSystem.resolveVariant({
        baseAssetId: options.baseAssetId,
        environmentContext: scenario.environmentContext
      })
    );

  const variantEntries = variantAssignments
    .map((assignment, index) =>
      buildVariantComparisonEntry(assignment, previewRecord, registry, index)
    )
    .sort(compareVariantEntries);

  const recommendedVariant = variantEntries[0];

  const recordBase = deepFreeze({
    schemaId: assetVariantComparisonRecordSchemaId,
    comparisonRecordId: `ASSET_VARIANT_COMPARISON_${normalizeSlug(options.baseAssetId)}`,
    assetId: options.baseAssetId,
    previewRecordId: previewRecord.previewRecordId,
    variantList: variantEntries,
    comparisonCriteria: deepFreeze([
      "style_match",
      "biome_compatibility",
      "atlas_compatibility",
      "performance_budget",
      "reuse_value"
    ]),
    qualitySummaries: deepFreeze(
      variantEntries.map((entry) =>
        deepFreeze({
          variantId: entry.selectedVariant,
          summary: entry.qualitySummary
        })
      )
    ),
    recommendedVariant: deepFreeze({
      variantId: recommendedVariant.selectedVariant,
      assetId: recommendedVariant.assetId,
      recommendationScore: recommendedVariant.recommendationScore,
      reason: recommendedVariant.recommendationReason
    }),
    reviewStatus: "COMPARISON_READY",
    reviewHistory: deepFreeze([previewRecord.reviewStatus, "COMPARISON_READY"]),
    previewContext: previewRecord.variantPreviewData.previewContext,
    validation: null
  });

  const validation = buildVariantComparisonValidation(recordBase, registry);
  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const checked = validateAssetVariantComparisonRecord(record);
  if (!checked.ok) {
    throw createVariantComparisonError(checked.errorCode, checked.message);
  }

  return record;
}

function buildSyntheticPreviewRecord(baseAssetId, registry, specificationLayer, qualityLayer) {
  const asset = registry.getAssetById(baseAssetId);
  if (!asset) {
    throw createVariantComparisonError(
      "missing_asset_variant_comparison_base_asset",
      `Base asset ${baseAssetId} is not registered.`
    );
  }

  const specification = specificationLayer.getSpecificationByAssetId(baseAssetId);
  if (!specification) {
    throw createVariantComparisonError(
      "missing_asset_variant_comparison_specification",
      `No approved creation specification exists for base asset ${baseAssetId}.`
    );
  }

  const qualityResult = qualityLayer.validateAsset({ assetId: baseAssetId });

  return deepFreeze({
    schemaId: "ASSET_PREVIEW_RECORD_001",
    previewRecordId: `ASSET_PREVIEW_${normalizeSlug(baseAssetId)}`,
    assetId: baseAssetId,
    recipeId: specification.recipeId,
    previewStatus: "PREVIEW_DATA_AVAILABLE",
    variantPreviewData: deepFreeze({
      selectedVariant: specification.selectedVariant,
      availableVariants: deepFreeze([...specification.variants]),
      lodRequirements: deepFreeze([...specification.lodRequirements]),
      previewContext: deepFreeze({
        creationStage: "REFERENCE_REVIEW",
        assetState: "READY",
        dependencyStatus: "CLEAR"
      })
    }),
    qualitySummary: deepFreeze({
      reportId: qualityResult.report.reportId,
      approvalReadiness: qualityResult.report.approvalReadiness,
      warnings: deepFreeze([...qualityResult.report.warnings]),
      passCount: qualityResult.report.passFailResults.filter((entry) => entry.passed).length,
      failCount: qualityResult.report.passFailResults.filter((entry) => !entry.passed).length
    }),
    reviewStatus: "PREVIEW_READY",
    authoringHistory: deepFreeze({
      batchId: null,
      specificationId: specification.specificationId,
      assetState: "READY",
      transitionHistory: deepFreeze(["PREVIEW_READY"])
    }),
    reviewHistory: deepFreeze(["PREVIEW_READY"])
  });
}

function buildVariantComparisonEntry(assignment, previewRecord, registry, index) {
  const asset = registry.getAssetById(assignment.assetId);
  if (!asset) {
    throw createVariantComparisonError(
      "missing_asset_variant_comparison_target_asset",
      `Variant target asset ${assignment.assetId} is not registered.`
    );
  }

  const styleMatchScore = computeStyleMatchScore(assignment, previewRecord);
  const biomeCompatibilityScore = computeBiomeCompatibilityScore(assignment, asset);
  const atlasCompatibilityScore = computeAtlasCompatibilityScore(asset);
  const performanceBudgetScore = computePerformanceBudgetScore(asset);
  const reuseValueScore = computeReuseValueScore(asset);
  const recommendationScore = Math.round(
    styleMatchScore * 0.3 +
      biomeCompatibilityScore * 0.25 +
      atlasCompatibilityScore * 0.2 +
      performanceBudgetScore * 0.15 +
      reuseValueScore * 0.1
  );

  return deepFreeze({
    comparisonIndex: index + 1,
    assetId: assignment.assetId,
    baseAssetId: assignment.baseAssetId,
    baseReferenceType: assignment.baseReferenceType,
    baseReferenceId: assignment.baseReferenceId,
    selectedVariant: assignment.selectedVariant,
    assignmentId: assignment.assignmentId,
    comparisonCriteria: deepFreeze({
      styleMatch: styleMatchScore,
      biomeCompatibility: biomeCompatibilityScore,
      atlasCompatibility: atlasCompatibilityScore,
      performanceBudget: performanceBudgetScore,
      reuseValue: reuseValueScore
    }),
    qualitySummary: deepFreeze({
      approvalReadiness: previewRecord.qualitySummary.approvalReadiness,
      inheritedReportId: previewRecord.qualitySummary.reportId,
      warningCount: previewRecord.qualitySummary.warnings.length,
      compatibilityPreserved: assignment.validation.compatibilityPreserved
    }),
    recommendationScore,
    recommendationReason: buildRecommendationReason(
      assignment,
      styleMatchScore,
      biomeCompatibilityScore
    ),
    reviewStatus: "COMPARISON_READY"
  });
}

function buildVariantComparisonValidation(record, registry) {
  const variantsBelongToAsset = record.variantList.every(
    (entry) =>
      entry.baseAssetId === record.assetId &&
      registry.getAssetById(entry.assetId) !== null
  );
  const comparisonDataComplete = record.variantList.every(
    (entry) =>
      typeof entry.selectedVariant === "string" &&
      typeof entry.assignmentId === "string" &&
      typeof entry.recommendationScore === "number" &&
      entry.qualitySummary?.compatibilityPreserved === true
  );
  const deterministicRecommendation =
    record.recommendedVariant.variantId === record.variantList[0]?.selectedVariant;
  const noApprovalBypass = record.reviewStatus !== "REVIEW_APPROVED";
  const validationPassed =
    variantsBelongToAsset &&
    comparisonDataComplete &&
    deterministicRecommendation &&
    noApprovalBypass;

  return deepFreeze({
    schemaId: assetVariantComparisonValidationSchemaId,
    variantsBelongToAsset,
    comparisonDataComplete,
    deterministicRecommendation,
    noApprovalBypass,
    validationPassed,
    deterministicComparisonHash: computeDeterministicHash(buildComparisonSignature(record))
  });
}

function buildComparisonSignature(record) {
  return [
    record.comparisonRecordId,
    record.assetId,
    record.previewRecordId,
    record.variantList.map((entry) => [
      entry.assetId,
      entry.selectedVariant,
      entry.assignmentId,
      entry.comparisonCriteria,
      entry.recommendationScore
    ]),
    record.recommendedVariant,
    record.reviewStatus
  ];
}

function computeStyleMatchScore(assignment, previewRecord) {
  const styleProfile = assignment.environmentContext.styleProfile ?? "";
  const selectedVariant = assignment.selectedVariant;
  const availableVariants = previewRecord.variantPreviewData.availableVariants ?? [];
  let score = 50;

  if (availableVariants.includes(selectedVariant)) {
    score += 20;
  }
  if (assignment.reason.includes("styleProfile")) {
    score += 20;
  }
  if (styleProfile.includes("SUBURBAN") && selectedVariant === "suburban") {
    score += 10;
  }

  return clampScore(score);
}

function computeBiomeCompatibilityScore(assignment, asset) {
  let score = assignment.reason.includes("biome:") ? 80 : 55;
  if (assignment.environmentContext.biome.includes("COASTAL") && asset.assetType.includes("COASTAL")) {
    score += 15;
  }
  if (assignment.environmentContext.biome.includes("FARMLAND") && asset.assetType.includes("RURAL")) {
    score += 15;
  }
  if (assignment.environmentContext.biome.includes("SUBURBAN") && asset.assetType.includes("SUBURBAN")) {
    score += 15;
  }
  return clampScore(score);
}

function computeAtlasCompatibilityScore(asset) {
  const atlasCompatible = asset.atlasCompatibility?.atlasCompatible === true ? 50 : 0;
  const objectTypeScore = Math.min(
    (asset.atlasCompatibility?.supportedObjectTypes?.length ?? 0) * 15,
    30
  );
  const recipeScore = Math.min(
    (asset.atlasCompatibility?.atlasAssignmentRecipeIds?.length ?? 0) * 5,
    20
  );
  return clampScore(atlasCompatible + objectTypeScore + recipeScore);
}

function computePerformanceBudgetScore(asset) {
  const lodScore = Math.min((asset.lodRules?.length ?? 0) * 20, 60);
  const instanceFriendlyBonus =
    asset.metadata?.performanceBudget?.instanceFriendly === true ? 20 : 10;
  const polygonBonus =
    asset.metadata?.performanceBudget?.polygonBudget === "low"
      ? 20
      : asset.metadata?.performanceBudget?.polygonBudget === "medium"
        ? 15
        : 10;
  return clampScore(lodScore + instanceFriendlyBonus + polygonBonus);
}

function computeReuseValueScore(asset) {
  const variantScore = Math.min((asset.metadata?.supportedVariants?.length ?? 0) * 12, 60);
  const usageScore = Math.min((asset.usageRules?.length ?? 0) * 8, 40);
  return clampScore(variantScore + usageScore);
}

function buildRecommendationReason(assignment, styleMatchScore, biomeCompatibilityScore) {
  return `Variant ${assignment.selectedVariant} scores highest on style (${styleMatchScore}) and biome compatibility (${biomeCompatibilityScore}) for the current comparison set.`;
}

function compareVariantEntries(left, right) {
  if (left.recommendationScore !== right.recommendationScore) {
    return right.recommendationScore - left.recommendationScore;
  }
  return left.selectedVariant.localeCompare(right.selectedVariant);
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({
      baseAssetId: defaultBaseAssetId,
      previewRecord: null,
      variantAssignments: null
    });
  }
  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createVariantComparisonError(
      "invalid_asset_variant_comparison_options",
      "Asset variant comparison options must be an object when provided."
    );
  }
  return deepFreeze({
    baseAssetId: rawOptions.baseAssetId
      ? normalizeString(rawOptions.baseAssetId)
      : defaultBaseAssetId,
    previewRecord: rawOptions.previewRecord ?? null,
    variantAssignments: rawOptions.variantAssignments ?? null
  });
}

function normalizeRegistry(rawRegistry) {
  if (rawRegistry?.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001") {
    throw createVariantComparisonError(
      "invalid_asset_variant_comparison_registry",
      "Asset variant comparison layer requires a valid Asset Factory registry layer."
    );
  }
  return rawRegistry;
}

function normalizeVariantSystem(rawSystem) {
  if (rawSystem?.schemaId !== "ASSET_VARIANT_SYSTEM_001") {
    throw createVariantComparisonError(
      "invalid_asset_variant_comparison_variant_system",
      "Asset variant comparison layer requires a valid Asset Variant System."
    );
  }
  return rawSystem;
}

function normalizeSpecificationLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_CREATION_SPECIFICATION_LAYER_001") {
    throw createVariantComparisonError(
      "invalid_asset_variant_comparison_specification_layer",
      "Asset variant comparison layer requires a valid Asset Creation Specification layer."
    );
  }
  return rawLayer;
}

function normalizeQualityLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_QUALITY_VALIDATION_LAYER_001") {
    throw createVariantComparisonError(
      "invalid_asset_variant_comparison_quality_layer",
      "Asset variant comparison layer requires a valid Asset Quality Validation layer."
    );
  }
  return rawLayer;
}

function normalizeString(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createVariantComparisonError(
      "invalid_asset_variant_comparison_string",
      "Expected a non-empty string."
    );
  }
  return value.trim().toUpperCase();
}

function normalizeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createVariantComparisonError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return value;
}
