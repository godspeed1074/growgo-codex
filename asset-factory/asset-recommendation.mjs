import { createHash } from "node:crypto";

import {
  createAssetFactoryRegistryLayer,
  validateAssetFactoryRegistryLayer
} from "./asset-registry.mjs";
import {
  createAssetVariantSystem,
  validateAssetVariantSystem
} from "./asset-variant-system.mjs";
import {
  createAssetDependencyManagementLayer,
  validateAssetDependencyManagementLayer
} from "./asset-dependency-management.mjs";
import {
  createAssetDiscoveryLayer,
  validateAssetDiscoveryLayer
} from "./asset-discovery.mjs";
import { createAssetVersioningLayer } from "./asset-versioning.mjs";
import { createAssetReleaseManagementLayer } from "./asset-release-management.mjs";

export const assetRecommendationLayerSchemaId = "ASSET_RECOMMENDATION_LAYER_001";
export const assetRecommendationResultSchemaId = "ASSET_RECOMMENDATION_RESULT_001";
export const assetRecommendationValidationSchemaId = "ASSET_RECOMMENDATION_VALIDATION_001";

const defaultRecommendationContext = deepFreeze({
  environmentType: "COASTAL_PARK",
  biome: "COASTAL",
  objectClassification: "NATURAL_FEATURE",
  atlasUsage: "PARK",
  existingAssetRelationships: ["GROUND_COASTAL_GRASS_001"],
  variantCompatibility: deepFreeze({
    baseReferenceType: "asset",
    baseReferenceId: "TREE_EUCALYPTUS_001"
  })
});

export function createAssetRecommendationLayer(
  rawOptions = {},
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawVariantSystem = createAssetVariantSystem(rawRegistry),
  rawDependencyLayer = createAssetDependencyManagementLayer({}, rawRegistry, rawVariantSystem),
  rawDiscoveryLayer = createAssetDiscoveryLayer(
    {},
    rawRegistry,
    rawVariantSystem,
    createAssetVersioningLayer(rawRegistry),
    rawDependencyLayer,
    createAssetReleaseManagementLayer()
  )
) {
  const options = normalizeOptions(rawOptions);
  const registry = normalizeRegistry(rawRegistry);
  const variantSystem = normalizeVariantSystem(rawVariantSystem);
  const dependencyLayer = normalizeDependencyLayer(rawDependencyLayer);
  const discoveryLayer = normalizeDiscoveryLayer(rawDiscoveryLayer);
  const sourceContext = buildSourceContext(registry, variantSystem, dependencyLayer, discoveryLayer, options);
  const validation = buildRecommendationValidation(sourceContext);

  const layer = deepFreeze({
    schemaId: assetRecommendationLayerSchemaId,
    layerId: "ASSET_RECOMMENDATION_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    variantSystemId: variantSystem.systemId,
    dependencyLayerId: dependencyLayer.layerId,
    discoveryLayerId: discoveryLayer.layerId,
    candidateCount: sourceContext.candidates.length,
    validation,
    recommend(rawContext = {}) {
      return recommendAssets(rawContext, sourceContext);
    }
  });

  const checked = validateAssetRecommendationLayer(layer);
  if (!checked.ok) {
    throw createRecommendationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetRecommendationLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetRecommendationLayerSchemaId) {
      throw createRecommendationError(
        "invalid_asset_recommendation_layer_schema",
        `Expected ${assetRecommendationLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (typeof rawLayer.recommend !== "function") {
      throw createRecommendationError(
        "invalid_asset_recommendation_api",
        "Asset recommendation layer must expose recommend."
      );
    }

    if (rawLayer.validation?.schemaId !== assetRecommendationValidationSchemaId) {
      throw createRecommendationError(
        "invalid_asset_recommendation_validation_schema",
        `Expected ${assetRecommendationValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "recommendedAssetsExist",
      "scoresDeterministic",
      "compatibilityValid",
      "noInvalidReferences",
      "noSourceMutation",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createRecommendationError(
          "asset_recommendation_layer_validation_failed",
          `Asset recommendation validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetRecommendationLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_recommendation_layer_validation_failed",
      message: error.message,
      assetRecommendationLayer: null
    });
  }
}

export function validateAssetRecommendationResult(rawResult, rawRegistry = createAssetFactoryRegistryLayer()) {
  try {
    const registry = normalizeRegistry(rawRegistry);

    if (rawResult?.schemaId !== assetRecommendationResultSchemaId) {
      throw createRecommendationError(
        "invalid_asset_recommendation_result_schema",
        `Expected ${assetRecommendationResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (!registry.getAssetById(rawResult.assetId)) {
      throw createRecommendationError(
        "invalid_asset_recommendation_result_asset",
        `Recommended asset ${rawResult?.assetId} is not registered.`
      );
    }

    if (!Number.isFinite(rawResult.score)) {
      throw createRecommendationError(
        "invalid_asset_recommendation_result_score",
        "Recommendation result must include a numeric score."
      );
    }

    if (
      typeof rawResult.reason !== "string" ||
      rawResult.reason.trim().length === 0
    ) {
      throw createRecommendationError(
        "invalid_asset_recommendation_result_reason",
        "Recommendation result must include a reason."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetRecommendationResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_recommendation_result_validation_failed",
      message: error.message,
      assetRecommendationResult: null
    });
  }
}

function buildSourceContext(registry, variantSystem, dependencyLayer, discoveryLayer, options) {
  const registryRecords = deepFreeze([...registry.records].sort((left, right) => left.assetId.localeCompare(right.assetId)));
  const assetIds = new Set(registryRecords.map((record) => record.assetId));
  const candidates = registryRecords.map((record) => buildCandidate(record, dependencyLayer, discoveryLayer));

  return deepFreeze({
    options,
    registry,
    variantSystem,
    dependencyLayer,
    discoveryLayer,
    registryRecords,
    assetIds,
    candidates: deepFreeze(candidates)
  });
}

function buildCandidate(record, dependencyLayer, discoveryLayer) {
  const outgoingDependencies = dependencyLayer.listDependenciesFor(record.assetId);
  const relatedAssets = discoveryLayer.getRelatedAssets(record.assetId).map((entry) => entry.assetId);
  const atlasObjectTypes = record.atlasCompatibility?.supportedObjectTypes ?? [];
  const atlasClassifications = record.atlasCompatibility?.supportedClassifications ?? [];
  const biomeCompatibility = record.biomeCompatibility ?? [];
  const usageRules = record.usageRules ?? [];

  return deepFreeze({
    record,
    dependencyIds: deepFreeze(
      outgoingDependencies
        .filter((entry) => !entry.targetId.startsWith("ENVIRONMENT::") && !entry.targetId.startsWith("ATLAS::"))
        .map((entry) => entry.targetId)
        .sort((left, right) => left.localeCompare(right))
    ),
    relatedAssets: deepFreeze([...new Set(relatedAssets)].sort((left, right) => left.localeCompare(right))),
    atlasObjectTypes: deepFreeze([...atlasObjectTypes].sort((left, right) => left.localeCompare(right))),
    atlasClassifications: deepFreeze([...atlasClassifications].sort((left, right) => left.localeCompare(right))),
    biomeCompatibility: deepFreeze([...biomeCompatibility].sort((left, right) => left.localeCompare(right))),
    usageRules: deepFreeze([...usageRules].sort((left, right) => left.localeCompare(right)))
  });
}

function recommendAssets(rawContext, sourceContext) {
  const context = normalizeRecommendationContext(rawContext);
  const beforeHash = computeDeterministicHash(buildSourceSignature(sourceContext));

  const results = sourceContext.candidates
    .map((candidate) => buildRecommendationResult(candidate, context, sourceContext))
    .filter((entry) => entry !== null)
    .sort(compareRecommendationResults);

  const afterHash = computeDeterministicHash(buildSourceSignature(sourceContext));
  if (beforeHash !== afterHash) {
    throw createRecommendationError(
      "asset_recommendation_source_mutation_detected",
      "Asset recommendation mutated source state."
    );
  }

  return deepFreeze(results);
}

function buildRecommendationResult(candidate, context, sourceContext) {
  const atlasCompatibilityScore = computeAtlasCompatibilityScore(candidate, context);
  const biomeMatchScore = computeBiomeMatchScore(candidate, context);
  const variantMatch = resolveVariantMatch(candidate, context, sourceContext.variantSystem);
  const reuseValueScore = computeReuseValueScore(candidate);
  const dependencyCompatibilityScore = computeDependencyCompatibilityScore(candidate, context);

  const hasAtlasIntent = Boolean(context.objectClassification || context.atlasUsage);
  if (hasAtlasIntent && atlasCompatibilityScore === 0) {
    return null;
  }

  const score = Math.round(
    atlasCompatibilityScore * 0.35 +
      biomeMatchScore * 0.25 +
      variantMatch.score * 0.2 +
      reuseValueScore * 0.1 +
      dependencyCompatibilityScore * 0.1
  );

  if (score === 0) {
    return null;
  }

  const result = deepFreeze({
    schemaId: assetRecommendationResultSchemaId,
    assetId: candidate.record.assetId,
    recipeId: candidate.record.recipeId,
    score,
    reason: buildRecommendationReason(candidate, {
      atlasCompatibilityScore,
      biomeMatchScore,
      variantMatchScore: variantMatch.score,
      dependencyCompatibilityScore
    }),
    compatibilitySummary: deepFreeze({
      atlasCompatibility: atlasCompatibilityScore,
      biomeMatch: biomeMatchScore,
      variantMatch: variantMatch.score,
      reuseValue: reuseValueScore,
      dependencyCompatibility: dependencyCompatibilityScore,
      objectClassificationMatched: candidate.atlasClassifications.includes(context.objectClassification),
      atlasUsageMatched: candidate.atlasObjectTypes.includes(context.atlasUsage),
      biomeMatched: candidate.biomeCompatibility.includes(context.biome),
      variantMatched: variantMatch.matched,
      lifecycleStatus: "DISCOVERABLE"
    }),
    relatedAssets: candidate.relatedAssets
  });

  const checked = validateAssetRecommendationResult(result, sourceContext.registry);
  if (!checked.ok) {
    throw createRecommendationError(checked.errorCode, checked.message);
  }

  return result;
}

function computeAtlasCompatibilityScore(candidate, context) {
  let score = 0;

  if (context.objectClassification && candidate.atlasClassifications.includes(context.objectClassification)) {
    score = Math.max(score, 85);
  }

  if (context.atlasUsage && candidate.atlasObjectTypes.includes(context.atlasUsage)) {
    score = Math.max(score, 100);
  }

  if (
    context.atlasUsage &&
    candidate.usageRules.some((rule) => rule.toUpperCase().includes(context.atlasUsage))
  ) {
    score = Math.max(score, 70);
  }

  if (
    context.objectClassification === "RESIDENTIAL" &&
    candidate.record.assetType.includes("RESIDENTIAL")
  ) {
    score = Math.max(score, 90);
  }

  if (context.atlasUsage === "HOUSE") {
    if (candidate.record.assetType.includes("HOUSE")) {
      score = Math.max(score, 100);
    } else if (
      candidate.record.assetType.includes("GARDEN") ||
      candidate.record.assetFamily.includes("DETAIL")
    ) {
      score = Math.min(score, 60);
    }
  }

  return score;
}

function computeBiomeMatchScore(candidate, context) {
  if (!context.biome) {
    return 60;
  }

  if (candidate.biomeCompatibility.includes(context.biome)) {
    return 100;
  }

  const biomeTokens = context.biome.split("_");
  if (
    candidate.biomeCompatibility.some((value) => biomeTokens.some((token) => value.includes(token))) ||
    candidate.usageRules.some((rule) => biomeTokens.some((token) => rule.toUpperCase().includes(token)))
  ) {
    return 70;
  }

  if (candidate.usageRules.some((rule) => rule.toUpperCase().includes(context.biome))) {
    return 70;
  }

  if (
    context.environmentType &&
    candidate.usageRules.some((rule) => context.environmentType.includes(rule.toUpperCase()) || rule.toUpperCase().includes(context.environmentType))
  ) {
    return 60;
  }

  return 0;
}

function resolveVariantMatch(candidate, context, variantSystem) {
  const variantCompatibility = context.variantCompatibility;
  if (!variantCompatibility) {
    return deepFreeze({
      score: inferImplicitVariantScore(candidate, context),
      matched: false
    });
  }

  try {
    const assignment = variantSystem.resolveVariant({
      ...(variantCompatibility.baseReferenceType === "asset"
        ? { baseAssetId: variantCompatibility.baseReferenceId }
        : { baseRecipeId: variantCompatibility.baseReferenceId }),
      environmentContext: deepFreeze({
        biome: context.biome,
        climate: context.climate,
        regionProfile: context.regionProfile,
        environmentType: context.environmentType,
        styleProfile: context.styleProfile
      })
    });

    if (assignment.assetId === candidate.record.assetId) {
      return deepFreeze({ score: 100, matched: true });
    }

    if (assignment.baseAssetId === candidate.record.assetId) {
      return deepFreeze({ score: 65, matched: false });
    }
  } catch {
    return deepFreeze({ score: inferImplicitVariantScore(candidate, context), matched: false });
  }

  return deepFreeze({ score: inferImplicitVariantScore(candidate, context), matched: false });
}

function inferImplicitVariantScore(candidate, context) {
  let score = 25;

  if (
    context.environmentType &&
    candidate.usageRules.some((rule) => rule.toUpperCase().includes(context.environmentType))
  ) {
    score += 20;
  }

  if (
    context.biome &&
    (candidate.biomeCompatibility.includes(context.biome) ||
      candidate.usageRules.some((rule) => rule.toUpperCase().includes(context.biome)))
  ) {
    score += 25;
  }

  return Math.min(score, 80);
}

function computeReuseValueScore(candidate) {
  const atlasBreadth = candidate.atlasObjectTypes.length * 10;
  const usageBreadth = candidate.usageRules.length * 6;
  const relationshipBreadth = candidate.relatedAssets.length * 5;
  return Math.min(100, 30 + atlasBreadth + usageBreadth + relationshipBreadth);
}

function computeDependencyCompatibilityScore(candidate, context) {
  if (context.existingAssetRelationships.length === 0) {
    return 60;
  }

  const relationshipSet = new Set(context.existingAssetRelationships);
  const directMatch = candidate.relatedAssets.filter((assetId) => relationshipSet.has(assetId)).length;
  const dependencyMatch = candidate.dependencyIds.filter((assetId) => relationshipSet.has(assetId)).length;

  if (directMatch === 0 && dependencyMatch === 0) {
    return 20;
  }

  return Math.min(100, 40 + directMatch * 30 + dependencyMatch * 20);
}

function buildRecommendationReason(candidate, scoreSet) {
  const leadingSignals = [
    ["Atlas compatibility", scoreSet.atlasCompatibilityScore],
    ["biome match", scoreSet.biomeMatchScore],
    ["variant match", scoreSet.variantMatchScore],
    ["dependency compatibility", scoreSet.dependencyCompatibilityScore]
  ]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 2)
    .map(([label, score]) => `${label} (${score})`);

  return `${candidate.record.assetId} is recommended because of ${leadingSignals.join(" and ")}.`;
}

function buildRecommendationValidation(sourceContext) {
  const recommendedAssetsExist = sourceContext.candidates.every(
    (candidate) => sourceContext.registry.getAssetById(candidate.record.assetId) !== null
  );

  const firstPass = recommendAssets(defaultRecommendationContext, sourceContext);
  const secondPass = recommendAssets(defaultRecommendationContext, sourceContext);
  const scoresDeterministic = JSON.stringify(firstPass) === JSON.stringify(secondPass);

  const compatibilityValid = firstPass.every((entry) =>
    entry.compatibilitySummary.atlasCompatibility >= 0 &&
    entry.compatibilitySummary.biomeMatch >= 0 &&
    entry.compatibilitySummary.variantMatch >= 0 &&
    entry.compatibilitySummary.reuseValue >= 0 &&
    entry.compatibilitySummary.dependencyCompatibility >= 0
  );

  const assetIds = sourceContext.assetIds;
  const noInvalidReferences = firstPass.every((entry) =>
    assetIds.has(entry.assetId) &&
    entry.relatedAssets.every((assetId) => assetIds.has(assetId))
  );

  const beforeHash = computeDeterministicHash(buildSourceSignature(sourceContext));
  const afterHash = computeDeterministicHash(buildSourceSignature(sourceContext));
  const noSourceMutation = beforeHash === afterHash;
  const validationPassed =
    recommendedAssetsExist &&
    scoresDeterministic &&
    compatibilityValid &&
    noInvalidReferences &&
    noSourceMutation;

  return deepFreeze({
    schemaId: assetRecommendationValidationSchemaId,
    recommendedAssetsExist,
    scoresDeterministic,
    compatibilityValid,
    noInvalidReferences,
    noSourceMutation,
    validationPassed,
    deterministicRecommendationHash: computeDeterministicHash(
      firstPass.map((entry) => [
        entry.assetId,
        entry.recipeId,
        entry.score,
        entry.compatibilitySummary,
        entry.relatedAssets
      ])
    )
  });
}

function buildSourceSignature(sourceContext) {
  return [
    sourceContext.registryRecords.map((record) => record.assetId),
    sourceContext.variantSystem.validation?.deterministicVariantHash,
    sourceContext.dependencyLayer.validation?.deterministicGraphHash,
    sourceContext.discoveryLayer.validation?.deterministicSearchHash
  ];
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({});
  }
  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createRecommendationError(
      "invalid_asset_recommendation_options",
      "Asset recommendation options must be an object when provided."
    );
  }
  return deepFreeze({ ...rawOptions });
}

function normalizeRegistry(rawRegistry) {
  const checked = validateAssetFactoryRegistryLayer(rawRegistry);
  if (!checked.ok) {
    throw createRecommendationError(checked.errorCode, checked.message);
  }
  return rawRegistry;
}

function normalizeVariantSystem(rawSystem) {
  const checked = validateAssetVariantSystem(rawSystem);
  if (!checked.ok) {
    throw createRecommendationError(checked.errorCode, checked.message);
  }
  return rawSystem;
}

function normalizeDependencyLayer(rawLayer) {
  const checked = validateAssetDependencyManagementLayer(rawLayer);
  if (!checked.ok) {
    throw createRecommendationError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeDiscoveryLayer(rawLayer) {
  const checked = validateAssetDiscoveryLayer(rawLayer);
  if (!checked.ok) {
    throw createRecommendationError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeRecommendationContext(rawContext) {
  if (rawContext == null) {
    return defaultRecommendationContext;
  }
  if (typeof rawContext !== "object" || Array.isArray(rawContext)) {
    throw createRecommendationError(
      "invalid_asset_recommendation_context",
      "Recommendation context must be an object."
    );
  }

  return deepFreeze({
    environmentType: normalizeOptionalUpper(rawContext.environmentType),
    biome: normalizeOptionalUpper(rawContext.biome),
    climate: normalizeOptionalUpper(rawContext.climate),
    regionProfile: normalizeOptionalUpper(rawContext.regionProfile),
    objectClassification: normalizeOptionalUpper(rawContext.objectClassification),
    atlasUsage: normalizeOptionalUpper(rawContext.atlasUsage),
    styleProfile: normalizeOptionalUpper(rawContext.styleProfile),
    existingAssetRelationships: normalizeAssetList(rawContext.existingAssetRelationships),
    variantCompatibility: normalizeVariantCompatibility(rawContext.variantCompatibility)
  });
}

function normalizeVariantCompatibility(rawValue) {
  if (rawValue == null) {
    return null;
  }
  if (typeof rawValue !== "object" || Array.isArray(rawValue)) {
    throw createRecommendationError(
      "invalid_asset_recommendation_variant_compatibility",
      "variantCompatibility must be an object."
    );
  }

  return deepFreeze({
    baseReferenceType: normalizeEnum(rawValue.baseReferenceType, ["asset", "recipe"], "variantCompatibility.baseReferenceType"),
    baseReferenceId: normalizeString(rawValue.baseReferenceId, "variantCompatibility.baseReferenceId")
  });
}

function normalizeAssetList(rawValue) {
  if (rawValue == null) {
    return deepFreeze([]);
  }
  if (!Array.isArray(rawValue)) {
    throw createRecommendationError(
      "invalid_asset_recommendation_relationships",
      "existingAssetRelationships must be an array when provided."
    );
  }
  return deepFreeze(
    [...new Set(rawValue.map((value) => normalizeString(value, "existingAssetRelationships")))]
      .sort((left, right) => left.localeCompare(right))
  );
}

function normalizeOptionalUpper(value) {
  if (value == null) {
    return null;
  }
  return normalizeString(value, "recommendationContextValue");
}

function normalizeEnum(value, allowed, label) {
  if (typeof value !== "string" || !allowed.includes(value.trim().toLowerCase())) {
    throw createRecommendationError(
      `invalid_${label.replace(/\./g, "_")}`,
      `${label} must be one of ${allowed.join(", ")}.`
    );
  }
  return value.trim().toLowerCase();
}

function compareRecommendationResults(left, right) {
  return right.score - left.score || left.assetId.localeCompare(right.assetId);
}

function normalizeString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createRecommendationError(`invalid_${label}`, `${label} must be a non-empty string.`);
  }
  return value.trim().toUpperCase();
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createRecommendationError(code, message) {
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
