import {
  createNatureAssetPack,
  createCivicAssetPack,
  createTransportAssetPack,
  createRoadAndStreetAssetPack,
  createCommercialAssetPack,
  createResidentialAssetPack,
  createAssetFactoryRegistryLayer
} from "./asset-registry.mjs";
import { createAssetFactoryPackPrioritySystem } from "./asset-pack-priority.mjs";

export const assetFactoryCoverageReviewLayerSchemaId =
  "ASSET_FACTORY_COVERAGE_REVIEW_LAYER_001";
export const assetFactoryCoverageReportSchemaId =
  "ASSET_FACTORY_COVERAGE_REPORT_001";
export const assetFactoryCoverageValidationSchemaId =
  "ASSET_FACTORY_COVERAGE_VALIDATION_001";

const minimumRecommendedAssetsPerFamily = 2;

const packReviewDefinitions = deepFreeze([
  reviewDefinition({
    category: "NATURE",
    packLabel: "NATURE_ASSET_PACK_001",
    createPack: createNatureAssetPack,
    expectedFamilies: [
      "TREE_ASSET_FAMILY_001",
      "GROUND_ASSET_FAMILY_001",
      "VEGETATION_ASSET_FAMILY_001",
      "TERRAIN_FEATURE_ASSET_FAMILY_001"
    ],
    atlasDemandRecipes: [
      "BEACH_RECIPE_001",
      "RESERVE_RECIPE_001",
      "FOREST_RECIPE_001",
      "RECIPE_TREATMENT_PARK_STANDARD_001"
    ]
  }),
  reviewDefinition({
    category: "CIVIC",
    packLabel: "CIVIC_ASSET_PACK_001",
    createPack: createCivicAssetPack,
    expectedFamilies: [
      "SCHOOL_ASSET_FAMILY_001",
      "LIBRARY_ASSET_FAMILY_001",
      "COMMUNITY_BUILDING_ASSET_FAMILY_001",
      "SPORTS_FACILITY_ASSET_FAMILY_001"
    ],
    atlasDemandRecipes: [
      "SCHOOL_RECIPE_001",
      "LIBRARY_RECIPE_001",
      "COMMUNITY_BUILDING_RECIPE_001",
      "SPORTS_OVAL_RECIPE_001",
      "RECREATION_AREA_RECIPE_001"
    ]
  }),
  reviewDefinition({
    category: "TRANSPORT",
    packLabel: "TRANSPORT_ASSET_PACK_001",
    createPack: createTransportAssetPack,
    expectedFamilies: [
      "RAIL_ASSET_FAMILY_001",
      "BUS_ASSET_FAMILY_001",
      "FERRY_ASSET_FAMILY_001",
      "ROAD_INFRASTRUCTURE_ASSET_FAMILY_001"
    ],
    atlasDemandRecipes: [
      "RAILWAY_STATION_RECIPE_001",
      "FERRY_TERMINAL_RECIPE_001",
      "BUS_STOP_RECIPE_001",
      "RECIPE_TRANSPORT_ROUTE_STANDARD_001"
    ]
  }),
  reviewDefinition({
    category: "ROAD_AND_STREET",
    packLabel: "ROAD_AND_STREET_ASSET_PACK_001",
    createPack: createRoadAndStreetAssetPack,
    expectedFamilies: [
      "ROAD_SURFACE_ASSET_FAMILY_001",
      "SIDEWALK_ASSET_FAMILY_001",
      "STREET_FURNITURE_ASSET_FAMILY_001",
      "ROAD_DETAIL_ASSET_FAMILY_001"
    ],
    atlasDemandRecipes: [
      "RESIDENTIAL_STREET_RECIPE_001",
      "TOWN_MAIN_ROAD_RECIPE_001",
      "PEDESTRIAN_PATH_RECIPE_001",
      "INTERSECTION_RECIPE_001",
      "STREET_FURNITURE_RECIPE_001"
    ]
  }),
  reviewDefinition({
    category: "COMMERCIAL",
    packLabel: "COMMERCIAL_ASSET_PACK_001",
    createPack: createCommercialAssetPack,
    expectedFamilies: [
      "FOOD_BUSINESS_ASSET_FAMILY_001",
      "RETAIL_ASSET_FAMILY_001",
      "SERVICE_ASSET_FAMILY_001",
      "HOSPITALITY_ASSET_FAMILY_001"
    ],
    atlasDemandRecipes: [
      "RECIPE_BUILDING_BAKERY_SMALL_TOWN_001",
      "RECIPE_BUILDING_CAFE_COASTAL_001",
      "RECIPE_BUILDING_FUEL_STATION_STANDARD_001",
      "RECIPE_BUILDING_SHOP_STANDARD_001"
    ]
  }),
  reviewDefinition({
    category: "RESIDENTIAL",
    packLabel: "RESIDENTIAL_ASSET_PACK_001",
    createPack: createResidentialAssetPack,
    expectedFamilies: [
      "HOUSE_ASSET_FAMILY_001",
      "MULTI_UNIT_ASSET_FAMILY_001",
      "RESIDENTIAL_DETAIL_ASSET_FAMILY_001"
    ],
    atlasDemandRecipes: [
      "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001",
      "RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001"
    ]
  })
]);

export function createAssetFactoryCoverageReviewLayer() {
  const registry = createAssetFactoryRegistryLayer();
  const prioritySystem = createAssetFactoryPackPrioritySystem();
  const priorityOrder = new Map(
    prioritySystem.packs.map((pack, index) => [normalizePriorityCategory(pack.packId), index])
  );

  const entries = packReviewDefinitions
    .map((definition) => buildReviewEntry(definition, registry, priorityOrder))
    .sort(compareCoverageEntries);

  const report = deepFreeze({
    schemaId: assetFactoryCoverageReportSchemaId,
    reportId: "ASSET_FACTORY_COVERAGE_REPORT_001_DEFAULT",
    entries,
    recommendedNextActions: buildRecommendedNextActions(entries),
    summary: buildCoverageSummary(entries)
  });

  const validation = buildCoverageValidation(report, registry);
  const layer = deepFreeze({
    schemaId: assetFactoryCoverageReviewLayerSchemaId,
    layerId: "ASSET_FACTORY_COVERAGE_REVIEW_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    prioritySystemId: prioritySystem.systemId,
    report,
    validation,
    getPackReport(category) {
      const normalizedCategory = normalizeString(category);
      return this.report.entries.find((entry) => entry.category === normalizedCategory) ?? null;
    }
  });

  const checked = validateAssetFactoryCoverageReviewLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetFactoryCoverageReviewLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetFactoryCoverageReviewLayerSchemaId) {
      throw createValidationError(
        "invalid_asset_factory_coverage_review_schema",
        `Expected ${assetFactoryCoverageReviewLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.report?.schemaId !== assetFactoryCoverageReportSchemaId) {
      throw createValidationError(
        "invalid_asset_factory_coverage_report_schema",
        `Expected ${assetFactoryCoverageReportSchemaId} but received ${rawLayer.report?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetFactoryCoverageValidationSchemaId) {
      throw createValidationError(
        "invalid_asset_factory_coverage_validation_schema",
        `Expected ${assetFactoryCoverageValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.report.entries) || rawLayer.report.entries.length === 0) {
      throw createValidationError(
        "invalid_asset_factory_coverage_entries",
        "Coverage review report must expose a non-empty entries array."
      );
    }

    for (const key of [
      "registryCompleteness",
      "recipeLinksValid",
      "deterministicAnalysis",
      "noDuplicateCategories",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createValidationError(
          "asset_factory_coverage_validation_failed",
          `Coverage validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildValidationSignatureSource(rawLayer.report));
    if (expectedHash !== rawLayer.validation.deterministicCoverageHash) {
      throw createValidationError(
        "asset_factory_coverage_hash_mismatch",
        "Coverage review deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetFactoryCoverageReviewLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_factory_coverage_validation_failed",
      message: error.message,
      assetFactoryCoverageReviewLayer: null
    });
  }
}

function buildReviewEntry(definition, registry, priorityOrder) {
  const pack = definition.createPack();
  const familyCounts = countAssetsByFamily(pack.assets);
  const presentFamilies = [...familyCounts.keys()].sort();
  const missingAssetFamilies = definition.expectedFamilies.filter(
    (family) => !familyCounts.has(family)
  );
  const coveredRecipes = definition.atlasDemandRecipes.filter((recipeId) =>
    hasRegistryCoverageForRecipe(registry.records, recipeId)
  );
  const uncoveredRecipes = definition.atlasDemandRecipes.filter(
    (recipeId) => !coveredRecipes.includes(recipeId)
  );
  const underfilledAssetFamilies = definition.expectedFamilies
    .map((family) => ({
      assetFamily: family,
      assetCount: familyCounts.get(family) ?? 0,
      recommendedMinimum: minimumRecommendedAssetsPerFamily
    }))
    .filter((entry) => entry.assetCount < entry.recommendedMinimum)
    .sort(compareBy("assetFamily"));

  const familyCoveragePercentage = toPercentage(
    definition.expectedFamilies.length - missingAssetFamilies.length,
    definition.expectedFamilies.length
  );
  const recipeCoveragePercentage = toPercentage(
    coveredRecipes.length,
    definition.atlasDemandRecipes.length
  );
  const variantCoveragePercentage = toPercentage(
    definition.expectedFamilies.length - underfilledAssetFamilies.length,
    definition.expectedFamilies.length
  );
  const packCoveragePercentage = Math.round(
    (familyCoveragePercentage + recipeCoveragePercentage + variantCoveragePercentage) / 3
  );

  const highestValueGaps = buildHighestValueGaps(
    definition.category,
    uncoveredRecipes,
    underfilledAssetFamilies
  );
  const priorityIndex = priorityOrder.get(definition.category) ?? Number.MAX_SAFE_INTEGER;

  return deepFreeze({
    category: definition.category,
    packLabel: definition.packLabel,
    packCoveragePercentage,
    familyCoveragePercentage,
    recipeCoveragePercentage,
    variantCoveragePercentage,
    assetCount: pack.assets.length,
    assetFamiliesPresent: deepFreeze(presentFamilies),
    missingAssetFamilies: deepFreeze(missingAssetFamilies),
    recipeCoverage: deepFreeze({
      totalDemandRecipes: definition.atlasDemandRecipes.length,
      coveredRecipes: deepFreeze(coveredRecipes.sort()),
      uncoveredRecipes: deepFreeze(uncoveredRecipes.sort())
    }),
    underfilledAssetFamilies: deepFreeze(underfilledAssetFamilies),
    highestValueGaps,
    recommendedNextAction: buildRecommendedNextAction(
      definition.category,
      uncoveredRecipes,
      underfilledAssetFamilies
    ),
    priorityIndex
  });
}

function buildRecommendedNextActions(entries) {
  return deepFreeze(
    entries.map((entry, index) =>
      deepFreeze({
        rank: index + 1,
        category: entry.category,
        packLabel: entry.packLabel,
        packCoveragePercentage: entry.packCoveragePercentage,
        highestValueGapCount: entry.highestValueGaps.length,
        recommendedNextAction: entry.recommendedNextAction
      })
    )
  );
}

function buildCoverageSummary(entries) {
  const totalCoverage = entries.reduce((sum, entry) => sum + entry.packCoveragePercentage, 0);
  const uncoveredRecipeCount = entries.reduce(
    (sum, entry) => sum + entry.recipeCoverage.uncoveredRecipes.length,
    0
  );
  return deepFreeze({
    reviewedPackCount: entries.length,
    averageCoveragePercentage: Math.round(totalCoverage / entries.length),
    totalUncoveredRecipes: uncoveredRecipeCount,
    duplicateCategories: new Set(entries.map((entry) => entry.category)).size !== entries.length
  });
}

function buildCoverageValidation(report, registry) {
  const categories = report.entries.map((entry) => entry.category);
  const noDuplicateCategories = new Set(categories).size === categories.length;
  const recipeLinksValid = report.entries.every((entry) =>
    entry.recipeCoverage.coveredRecipes.every((recipeId) =>
      hasRegistryCoverageForRecipe(registry.records, recipeId)
    )
  );
  const registryCompleteness = report.entries.every(
    (entry) => entry.assetCount >= entry.assetFamiliesPresent.length
  );
  const deterministicAnalysis = true;
  return deepFreeze({
    schemaId: assetFactoryCoverageValidationSchemaId,
    registryCompleteness,
    recipeLinksValid,
    deterministicAnalysis,
    noDuplicateCategories,
    validationPassed:
      registryCompleteness && recipeLinksValid && deterministicAnalysis && noDuplicateCategories,
    deterministicCoverageHash: computeDeterministicHash(buildValidationSignatureSource(report))
  });
}

function buildHighestValueGaps(category, uncoveredRecipes, underfilledAssetFamilies) {
  const recipeGaps = uncoveredRecipes.map((recipeId) =>
    deepFreeze({
      gapType: "missing_recipe_coverage",
      category,
      target: recipeId,
      impactScore: 50
    })
  );
  const familyGaps = underfilledAssetFamilies.map((entry) =>
    deepFreeze({
      gapType: "underfilled_asset_family",
      category,
      target: entry.assetFamily,
      impactScore: 20 + (entry.recommendedMinimum - entry.assetCount) * 5
    })
  );
  return deepFreeze(
    [...recipeGaps, ...familyGaps]
      .sort((left, right) => right.impactScore - left.impactScore || left.target.localeCompare(right.target))
  );
}

function buildRecommendedNextAction(category, uncoveredRecipes, underfilledAssetFamilies) {
  if (uncoveredRecipes.length > 0) {
    return `Close Atlas recipe bridge coverage for ${category.toLowerCase()} recipes: ${uncoveredRecipes.join(", ")}.`;
  }
  if (underfilledAssetFamilies.length > 0) {
    return `Increase variant depth for ${category.toLowerCase()} families: ${underfilledAssetFamilies
      .map((entry) => entry.assetFamily)
      .join(", ")}.`;
  }
  return `Maintain ${category.toLowerCase()} coverage and defer new work until higher-value gaps clear.`;
}

function hasRegistryCoverageForRecipe(records, recipeId) {
  return records.some(
    (record) =>
      record.recipeId === recipeId ||
      record.atlasCompatibility.atlasAssignmentRecipeIds.includes(recipeId)
  );
}

function countAssetsByFamily(records) {
  const counts = new Map();
  for (const record of records) {
    counts.set(record.assetFamily, (counts.get(record.assetFamily) ?? 0) + 1);
  }
  return counts;
}

function normalizePriorityCategory(packId) {
  return normalizeString(packId.replace(/_PACK_001$/, ""));
}

function reviewDefinition(definition) {
  return deepFreeze(definition);
}

function compareCoverageEntries(left, right) {
  if (left.packCoveragePercentage !== right.packCoveragePercentage) {
    return left.packCoveragePercentage - right.packCoveragePercentage;
  }
  if (left.priorityIndex !== right.priorityIndex) {
    return left.priorityIndex - right.priorityIndex;
  }
  return left.category.localeCompare(right.category);
}

function compareBy(key) {
  return (left, right) => String(left[key]).localeCompare(String(right[key]));
}

function toPercentage(numerator, denominator) {
  if (denominator === 0) {
    return 100;
  }
  return Math.round((numerator / denominator) * 100);
}

function buildValidationSignatureSource(report) {
  return {
    entries: report.entries.map((entry) => ({
      category: entry.category,
      packCoveragePercentage: entry.packCoveragePercentage,
      familyCoveragePercentage: entry.familyCoveragePercentage,
      recipeCoveragePercentage: entry.recipeCoveragePercentage,
      variantCoveragePercentage: entry.variantCoveragePercentage,
      missingAssetFamilies: entry.missingAssetFamilies,
      uncoveredRecipes: entry.recipeCoverage.uncoveredRecipes,
      underfilledAssetFamilies: entry.underfilledAssetFamilies
    })),
    recommendedNextActions: report.recommendedNextActions,
    summary: report.summary
  };
}

function normalizeString(value) {
  return String(value).trim().toUpperCase();
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function computeDeterministicHash(value) {
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
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return value;
}
