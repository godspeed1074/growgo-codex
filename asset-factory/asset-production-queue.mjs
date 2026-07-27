import { createHash } from "node:crypto";

import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetFactoryCoverageReviewLayer } from "./asset-coverage-review.mjs";
import { createAssetFactoryPackPrioritySystem } from "./asset-pack-priority.mjs";

export const assetProductionQueueLayerSchemaId = "ASSET_PRODUCTION_QUEUE_LAYER_001";
export const assetProductionQueueSchemaId = "ASSET_PRODUCTION_QUEUE_001";
export const assetProductionQueueValidationSchemaId =
  "ASSET_PRODUCTION_QUEUE_VALIDATION_001";

const categoryPackIds = deepFreeze({
  NATURE: "NATURE_ASSET_PACK_001",
  CIVIC: "CIVIC_ASSET_PACK_001",
  TRANSPORT: "TRANSPORT_ASSET_PACK_001",
  ROAD_AND_STREET: "ROAD_AND_STREET_ASSET_PACK_001",
  COMMERCIAL: "COMMERCIAL_ASSET_PACK_001",
  RESIDENTIAL: "RESIDENTIAL_ASSET_PACK_001"
});

const categoryVisualImpactScores = deepFreeze({
  NATURE: 82,
  CIVIC: 78,
  TRANSPORT: 74,
  ROAD_AND_STREET: 90,
  COMMERCIAL: 88,
  RESIDENTIAL: 86
});

const familyCategoryMap = deepFreeze({
  FAMILY_BUILDING_RESIDENTIAL_HOUSE: "RESIDENTIAL",
  FAMILY_BUILDING_COMMERCIAL_SMALL_SHOP: "COMMERCIAL",
  TREE_ASSET_FAMILY_001: "NATURE",
  GROUND_ASSET_FAMILY_001: "NATURE",
  VEGETATION_ASSET_FAMILY_001: "NATURE",
  TERRAIN_FEATURE_ASSET_FAMILY_001: "NATURE",
  BEACH_ASSET_FAMILY_001: "NATURE",
  FOREST_ASSET_FAMILY_001: "NATURE",
  RESERVE_ASSET_FAMILY_001: "NATURE",
  PARK_TREATMENT_ASSET_FAMILY_001: "NATURE",
  SCHOOL_ASSET_FAMILY_001: "CIVIC",
  LIBRARY_ASSET_FAMILY_001: "CIVIC",
  COMMUNITY_BUILDING_ASSET_FAMILY_001: "CIVIC",
  SPORTS_FACILITY_ASSET_FAMILY_001: "CIVIC",
  RAIL_ASSET_FAMILY_001: "TRANSPORT",
  BUS_ASSET_FAMILY_001: "TRANSPORT",
  FERRY_ASSET_FAMILY_001: "TRANSPORT",
  ROAD_INFRASTRUCTURE_ASSET_FAMILY_001: "TRANSPORT",
  ROAD_SURFACE_ASSET_FAMILY_001: "ROAD_AND_STREET",
  SIDEWALK_ASSET_FAMILY_001: "ROAD_AND_STREET",
  STREET_FURNITURE_ASSET_FAMILY_001: "ROAD_AND_STREET",
  ROAD_DETAIL_ASSET_FAMILY_001: "ROAD_AND_STREET",
  FOOD_BUSINESS_ASSET_FAMILY_001: "COMMERCIAL",
  RETAIL_ASSET_FAMILY_001: "COMMERCIAL",
  SERVICE_ASSET_FAMILY_001: "COMMERCIAL",
  HOSPITALITY_ASSET_FAMILY_001: "COMMERCIAL",
  HOUSE_ASSET_FAMILY_001: "RESIDENTIAL",
  MULTI_UNIT_ASSET_FAMILY_001: "RESIDENTIAL",
  RESIDENTIAL_DETAIL_ASSET_FAMILY_001: "RESIDENTIAL"
});

export function createAssetProductionQueueLayer(
  rawOptions = {},
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawCoverageReview = createAssetFactoryCoverageReviewLayer(),
  rawPackPrioritySystem = createAssetFactoryPackPrioritySystem()
) {
  const registry = normalizeRegistry(rawRegistry);
  const coverageReview = normalizeCoverageReview(rawCoverageReview);
  const packPrioritySystem = normalizePackPrioritySystem(rawPackPrioritySystem);
  const options = normalizeQueueOptions(rawOptions);

  const queue = buildAssetProductionQueue(
    options,
    registry,
    coverageReview,
    packPrioritySystem
  );
  const validation = buildAssetProductionQueueValidation(queue, registry);

  const layer = deepFreeze({
    schemaId: assetProductionQueueLayerSchemaId,
    layerId: "ASSET_PRODUCTION_QUEUE_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    coverageReviewLayerId: coverageReview.layerId,
    packPrioritySystemId: packPrioritySystem.systemId,
    queue,
    validation,
    getQueueEntry(assetId) {
      return this.queue.entries.find((entry) => entry.assetId === normalizeString(assetId)) ?? null;
    },
    listQueueEntries() {
      return [...this.queue.entries];
    }
  });

  const checked = validateAssetProductionQueueLayer(layer);
  if (!checked.ok) {
    throw createQueueValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetProductionQueueLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetProductionQueueLayerSchemaId) {
      throw createQueueValidationError(
        "invalid_asset_production_queue_layer_schema",
        `Expected ${assetProductionQueueLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.queue?.schemaId !== assetProductionQueueSchemaId) {
      throw createQueueValidationError(
        "invalid_asset_production_queue_schema",
        `Expected ${assetProductionQueueSchemaId} but received ${rawLayer.queue?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetProductionQueueValidationSchemaId) {
      throw createQueueValidationError(
        "invalid_asset_production_queue_validation_schema",
        `Expected ${assetProductionQueueValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "deterministicOrdering",
      "validAssetIds",
      "validPriorityScores",
      "noDuplicateQueueEntries",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createQueueValidationError(
          "asset_production_queue_layer_validation_failed",
          `Asset production queue validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetProductionQueueLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_production_queue_layer_validation_failed",
      message: error.message,
      assetProductionQueueLayer: null
    });
  }
}

export function validateAssetProductionQueue(rawQueue) {
  try {
    if (rawQueue?.schemaId !== assetProductionQueueSchemaId) {
      throw createQueueValidationError(
        "invalid_asset_production_queue_schema",
        `Expected ${assetProductionQueueSchemaId} but received ${rawQueue?.schemaId}.`
      );
    }

    if (rawQueue.validation?.schemaId !== assetProductionQueueValidationSchemaId) {
      throw createQueueValidationError(
        "invalid_asset_production_queue_validation_schema",
        `Expected ${assetProductionQueueValidationSchemaId} but received ${rawQueue.validation?.schemaId}.`
      );
    }

    for (const key of [
      "deterministicOrdering",
      "validAssetIds",
      "validPriorityScores",
      "noDuplicateQueueEntries",
      "validationPassed"
    ]) {
      if (rawQueue.validation[key] !== true) {
        throw createQueueValidationError(
          "asset_production_queue_validation_failed",
          `Asset production queue validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(
      rawQueue.entries.map((entry) => [
        entry.recommendedOrder,
        entry.assetId,
        entry.pack,
        entry.priorityScore,
        entry.reuseValue,
        entry.scoreBreakdown.atlasDemandScore,
        entry.scoreBreakdown.reuseScore,
        entry.scoreBreakdown.coverageGapScore,
        entry.scoreBreakdown.visualImpactScore,
        entry.scoreBreakdown.variantValueScore
      ])
    );

    if (expectedHash !== rawQueue.validation.deterministicQueueHash) {
      throw createQueueValidationError(
        "asset_production_queue_hash_mismatch",
        "Asset production queue deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetProductionQueue: rawQueue
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_production_queue_validation_failed",
      message: error.message,
      assetProductionQueue: null
    });
  }
}

function buildAssetProductionQueue(options, registry, coverageReview, packPrioritySystem) {
  const candidateAssetIds =
    options.candidateAssetIds ?? registry.records.map((record) => record.assetId).sort();
  const candidateRecords = candidateAssetIds.map((assetId) => {
    const record = registry.getAssetById(assetId);
    if (!record) {
      throw createQueueValidationError(
        "missing_asset_production_queue_asset",
        `Asset ${assetId} does not exist in the Asset Factory registry.`
      );
    }
    return record;
  });

  const reviewEntriesByCategory = new Map(
    coverageReview.report.entries.map((entry) => [entry.category, entry])
  );
  const coverageActionRankByCategory = new Map(
    coverageReview.report.recommendedNextActions.map((entry) => [entry.category, entry.rank])
  );
  const packPriorityRankByPackId = new Map(
    packPrioritySystem.packs.map((pack, index) => [pack.packId, index + 1])
  );
  const packReuseValueByPackId = new Map(
    packPrioritySystem.packs.map((pack) => [pack.packId, pack.estimatedReuseValue ?? 5])
  );
  const atlasDemandRecords = packPrioritySystem.atlasDemandRecipes;
  const atlasDemandRecipesByCategory = groupAtlasDemandRecipesByCategory(atlasDemandRecords);
  const maxAtlasDemandCount = Math.max(
    1,
    ...[...atlasDemandRecipesByCategory.values()].map((recipeIds) => recipeIds.length)
  );

  const entries = candidateRecords
    .map((record) =>
      buildQueueEntry(record, {
        reviewEntriesByCategory,
        coverageActionRankByCategory,
        packPriorityRankByPackId,
        packReuseValueByPackId,
        atlasDemandRecipesByCategory,
        maxAtlasDemandCount
      })
    )
    .sort(compareQueueEntries)
    .map((entry, index) =>
      deepFreeze({
        ...entry,
        recommendedOrder: index + 1
      })
    );

  const validation = buildAssetProductionQueueValidation(
    {
      schemaId: assetProductionQueueSchemaId,
      queueId: "ASSET_PRODUCTION_QUEUE_001_DEFAULT",
      entries
    },
    registry
  );

  return deepFreeze({
    schemaId: assetProductionQueueSchemaId,
    queueId: "ASSET_PRODUCTION_QUEUE_001_DEFAULT",
    entries,
    summary: deepFreeze({
      candidateCount: entries.length,
      topPriorityAssetId: entries[0]?.assetId ?? null,
      reviewedPackCount: new Set(entries.map((entry) => entry.pack)).size
    }),
    validation
  });
}

function buildQueueEntry(record, context) {
  const category = resolveAssetCategory(record);
  const pack = categoryPackIds[category];
  const reviewEntry = context.reviewEntriesByCategory.get(category);
  const actionRank = context.coverageActionRankByCategory.get(category) ?? 99;
  const categoryDemandRecipes = context.atlasDemandRecipesByCategory.get(category) ?? [];
  const atlasAssignmentRecipeIds = uniqueSorted([
    record.recipeId,
    ...(record.atlasCompatibility?.atlasAssignmentRecipeIds ?? [])
  ]);
  const directDemandMatches = atlasAssignmentRecipeIds.filter((recipeId) =>
    categoryDemandRecipes.includes(recipeId)
  );
  const supportedObjectTypeCount =
    record.atlasCompatibility?.supportedObjectTypes?.length ?? 0;
  const supportedVariantCount = record.metadata?.supportedVariants?.length ?? 0;
  const atlasDemandPressureScore = Math.round(
    (categoryDemandRecipes.length / context.maxAtlasDemandCount) * 100
  );
  const atlasDemandScore = clampScore(
    Math.round(
      atlasDemandPressureScore * 0.45 +
        directDemandMatches.length * 18 +
        supportedObjectTypeCount * 6
    )
  );
  const packReuseBase = (context.packReuseValueByPackId.get(pack) ?? 7) * 8;
  const reuseScore = clampScore(
    Math.round(
      packReuseBase +
        atlasAssignmentRecipeIds.length * 5 +
        (record.usageRules?.length ?? 0) * 3 +
        supportedObjectTypeCount * 4
    )
  );
  const coverageGapScore = buildCoverageGapScore(reviewEntry, actionRank);
  const visualImpactScore = clampScore(
    (categoryVisualImpactScores[category] ?? 75) +
      Math.min(supportedObjectTypeCount * 2, 6)
  );
  const variantValueScore = buildVariantValueScore(reviewEntry, supportedVariantCount);
  const priorityScore = clampScore(
    Math.round(
      atlasDemandScore * 0.3 +
        reuseScore * 0.2 +
        coverageGapScore * 0.2 +
        visualImpactScore * 0.15 +
        variantValueScore * 0.15
    )
  );

  return deepFreeze({
    assetId: record.assetId,
    assetType: record.assetType,
    assetFamily: record.assetFamily,
    pack,
    priorityScore,
    demandReason: buildDemandReason(
      record,
      reviewEntry,
      directDemandMatches,
      supportedVariantCount
    ),
    reuseValue: reuseScore,
    scoreBreakdown: deepFreeze({
      atlasDemandScore,
      reuseScore,
      coverageGapScore,
      visualImpactScore,
      variantValueScore
    }),
    supportedVariants: deepFreeze([...(record.metadata?.supportedVariants ?? [])]),
    atlasDemandRecipes: deepFreeze(directDemandMatches)
  });
}

function buildCoverageGapScore(reviewEntry, actionRank) {
  if (!reviewEntry) {
    return 0;
  }

  const coverageGap = 100 - reviewEntry.packCoveragePercentage;
  const actionPriorityScore = clampScore(100 - (actionRank - 1) * 20);
  return clampScore(Math.round(coverageGap * 0.6 + actionPriorityScore * 0.4));
}

function buildVariantValueScore(reviewEntry, supportedVariantCount) {
  const variantGapScore = reviewEntry ? 100 - reviewEntry.variantCoveragePercentage : 0;
  return clampScore(Math.round(variantGapScore * 0.55 + supportedVariantCount * 12));
}

function buildDemandReason(record, reviewEntry, directDemandMatches, supportedVariantCount) {
  if (reviewEntry?.recipeCoverage?.uncoveredRecipes?.length > 0) {
    const topUncoveredRecipe = reviewEntry.recipeCoverage.uncoveredRecipes[0];
    return `Supports ${reviewEntry.category.toLowerCase()} demand gap closure around ${topUncoveredRecipe}.`;
  }

  const underfilledFamily = reviewEntry?.underfilledAssetFamilies?.find(
    (entry) => entry.assetFamily === record.assetFamily
  );
  if (underfilledFamily) {
    const familyLabel = humanizeToken(record.assetFamily);
    if (supportedVariantCount > 0) {
      return `Adds depth to the underfilled ${familyLabel} family with ${supportedVariantCount} planned variants.`;
    }
    return `Strengthens the underfilled ${familyLabel} family where coverage depth is still shallow.`;
  }

  if (directDemandMatches.length > 1) {
    return `Bridges multiple Atlas recipe demands through ${directDemandMatches.length} compatible assignments.`;
  }

  if (directDemandMatches.length === 1) {
    return `Directly supports Atlas recipe demand for ${directDemandMatches[0]}.`;
  }

  return `Improves reusable ${resolveAssetCategory(record).toLowerCase()} coverage with a high-visibility asset type.`;
}

function buildAssetProductionQueueValidation(rawQueue, registry) {
  const entries = rawQueue.entries ?? [];
  const normalizedAssetIds = entries.map((entry) => entry.assetId);
  const validAssetIds = normalizedAssetIds.every((assetId) => registry.getAssetById(assetId));
  const validPriorityScores = entries.every((entry) =>
    isValidScore(entry.priorityScore) &&
    isValidScore(entry.reuseValue) &&
    isValidScore(entry.scoreBreakdown?.atlasDemandScore) &&
    isValidScore(entry.scoreBreakdown?.reuseScore) &&
    isValidScore(entry.scoreBreakdown?.coverageGapScore) &&
    isValidScore(entry.scoreBreakdown?.visualImpactScore) &&
    isValidScore(entry.scoreBreakdown?.variantValueScore)
  );
  const noDuplicateQueueEntries = new Set(normalizedAssetIds).size === normalizedAssetIds.length;
  const deterministicOrdering = entries.every(
    (entry, index) => entry.recommendedOrder === undefined || entry.recommendedOrder === index + 1
  );
  const validationPassed =
    deterministicOrdering &&
    validAssetIds &&
    validPriorityScores &&
    noDuplicateQueueEntries;

  return deepFreeze({
    schemaId: assetProductionQueueValidationSchemaId,
    deterministicOrdering,
    validAssetIds,
    validPriorityScores,
    noDuplicateQueueEntries,
    validationPassed,
    deterministicQueueHash: computeDeterministicHash(
      entries.map((entry) => [
        entry.recommendedOrder ?? 0,
        entry.assetId,
        entry.pack,
        entry.priorityScore,
        entry.reuseValue,
        entry.scoreBreakdown?.atlasDemandScore ?? 0,
        entry.scoreBreakdown?.reuseScore ?? 0,
        entry.scoreBreakdown?.coverageGapScore ?? 0,
        entry.scoreBreakdown?.visualImpactScore ?? 0,
        entry.scoreBreakdown?.variantValueScore ?? 0
      ])
    )
  });
}

function groupAtlasDemandRecipesByCategory(atlasDemandRecords) {
  const grouped = new Map();
  for (const record of atlasDemandRecords) {
    const category = normalizeCategory(record.category);
    const current = grouped.get(category) ?? [];
    current.push(record.recipeId);
    grouped.set(category, current);
  }
  return new Map(
    [...grouped.entries()].map(([category, recipeIds]) => [
      category,
      uniqueSorted(recipeIds)
    ])
  );
}

function resolveAssetCategory(record) {
  const category = familyCategoryMap[record.assetFamily];
  if (!category) {
    throw createQueueValidationError(
      "unsupported_asset_production_queue_family",
      `Asset family ${record.assetFamily} does not map to an Asset Factory production queue category.`
    );
  }
  return category;
}

function compareQueueEntries(left, right) {
  if (left.priorityScore !== right.priorityScore) {
    return right.priorityScore - left.priorityScore;
  }
  if (left.scoreBreakdown.coverageGapScore !== right.scoreBreakdown.coverageGapScore) {
    return right.scoreBreakdown.coverageGapScore - left.scoreBreakdown.coverageGapScore;
  }
  if (left.reuseValue !== right.reuseValue) {
    return right.reuseValue - left.reuseValue;
  }
  return left.assetId.localeCompare(right.assetId);
}

function normalizeQueueOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({});
  }

  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createQueueValidationError(
      "invalid_asset_production_queue_options",
      "Asset production queue options must be an object when provided."
    );
  }

  const candidateAssetIds = rawOptions.candidateAssetIds
    ? uniqueSorted(
        rawOptions.candidateAssetIds.map((assetId) =>
          normalizeString(assetId, "candidateAssetIds")
        )
      )
    : null;

  return deepFreeze({
    candidateAssetIds
  });
}

function normalizeRegistry(rawRegistry) {
  if (rawRegistry?.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001") {
    throw createQueueValidationError(
      "invalid_asset_production_queue_registry",
      "Asset production queue requires a valid Asset Factory registry layer."
    );
  }
  return rawRegistry;
}

function normalizeCoverageReview(rawCoverageReview) {
  if (rawCoverageReview?.schemaId !== "ASSET_FACTORY_COVERAGE_REVIEW_LAYER_001") {
    throw createQueueValidationError(
      "invalid_asset_production_queue_coverage_review",
      "Asset production queue requires a valid Asset Factory coverage review layer."
    );
  }
  return rawCoverageReview;
}

function normalizePackPrioritySystem(rawPackPrioritySystem) {
  if (rawPackPrioritySystem?.schemaId !== "ASSET_FACTORY_PACK_PRIORITY_SYSTEM_001") {
    throw createQueueValidationError(
      "invalid_asset_production_queue_pack_priority",
      "Asset production queue requires a valid Asset Factory pack priority system."
    );
  }
  return rawPackPrioritySystem;
}

function normalizeCategory(value) {
  const normalizedValue = normalizeString(value, "category");
  if (normalizedValue === "NATURAL") {
    return "NATURE";
  }
  return normalizedValue;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function humanizeToken(value) {
  return normalizeString(value)
    .replace(/_ASSET_FAMILY_001$/u, "")
    .replace(/^FAMILY_/u, "")
    .replace(/_/gu, " ")
    .toLowerCase();
}

function isValidScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function normalizeString(value, fieldName = "value") {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createQueueValidationError(
      "invalid_asset_production_queue_string",
      `Expected ${fieldName} to be a non-empty string.`
    );
  }
  return value.trim().toUpperCase();
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createQueueValidationError(code, message) {
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
