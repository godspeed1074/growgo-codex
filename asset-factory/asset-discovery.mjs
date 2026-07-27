import { createHash } from "node:crypto";

import {
  createAssetFactoryRegistryLayer,
  createNatureAssetPack,
  createCivicAssetPack,
  createTransportAssetPack,
  createRoadAndStreetAssetPack,
  createCommercialAssetPack,
  createResidentialAssetPack,
  validateAssetFactoryRegistryLayer
} from "./asset-registry.mjs";
import {
  createAssetVariantSystem,
  validateAssetVariantSystem
} from "./asset-variant-system.mjs";
import {
  createAssetVersioningLayer,
  validateAssetVersionRecord
} from "./asset-versioning.mjs";
import {
  createAssetDependencyManagementLayer,
  validateAssetDependencyRecord
} from "./asset-dependency-management.mjs";
import {
  createAssetReleaseManagementLayer,
  validateAssetReleaseRecord
} from "./asset-release-management.mjs";

export const assetDiscoveryLayerSchemaId = "ASSET_DISCOVERY_LAYER_001";
export const assetSearchResultSchemaId = "ASSET_SEARCH_RESULT_001";
export const assetDiscoveryValidationSchemaId = "ASSET_DISCOVERY_VALIDATION_001";

const defaultAssetId = "GROUND_BEACH_SAND_001";

export function createAssetDiscoveryLayer(
  rawOptions = {},
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawVariantSystem = createAssetVariantSystem(rawRegistry),
  rawVersioningLayer = createAssetVersioningLayer(rawRegistry),
  rawDependencyLayer = createAssetDependencyManagementLayer({}, rawRegistry, rawVariantSystem, rawVersioningLayer),
  rawReleaseLayer = createAssetReleaseManagementLayer()
) {
  const options = normalizeOptions(rawOptions);
  const registry = normalizeRegistry(rawRegistry);
  const variantSystem = normalizeVariantSystem(rawVariantSystem);
  const versioningLayer = normalizeVersioningLayer(rawVersioningLayer);
  const dependencyLayer = normalizeDependencyLayer(rawDependencyLayer);
  const releaseLayer = normalizeReleaseLayer(rawReleaseLayer);

  const sourceContext = buildSourceContext(
    registry,
    variantSystem,
    versioningLayer,
    dependencyLayer,
    releaseLayer,
    options
  );
  const searchIndex = buildSearchIndex(sourceContext);
  const validation = buildDiscoveryValidation(sourceContext, searchIndex);

  const layer = deepFreeze({
    schemaId: assetDiscoveryLayerSchemaId,
    layerId: "ASSET_DISCOVERY_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    variantSystemId: variantSystem.systemId,
    versioningLayerId: versioningLayer.layerId,
    dependencyLayerId: dependencyLayer.layerId,
    releaseLayerId: releaseLayer.layerId,
    indexedRecords: deepFreeze({
      assets: sourceContext.registry.records.length,
      recipes: sourceContext.recipes.length,
      variants: sourceContext.variantSystem.definitions.length,
      versions: sourceContext.versionRecords.length,
      dependencies: sourceContext.dependencyLayer.dependencyRecords.length,
      releases: sourceContext.releaseRecords.length
    }),
    validation,
    search(rawQuery = {}) {
      return searchAssetIndex(rawQuery, sourceContext, searchIndex);
    },
    getRelatedAssets(assetId) {
      return getRelatedAssetsFor(assetId, sourceContext, searchIndex);
    }
  });

  const checked = validateAssetDiscoveryLayer(layer);
  if (!checked.ok) {
    throw createDiscoveryError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetDiscoveryLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetDiscoveryLayerSchemaId) {
      throw createDiscoveryError(
        "invalid_asset_discovery_layer_schema",
        `Expected ${assetDiscoveryLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (typeof rawLayer.search !== "function" || typeof rawLayer.getRelatedAssets !== "function") {
      throw createDiscoveryError(
        "invalid_asset_discovery_layer_api",
        "Asset discovery layer must expose search and getRelatedAssets."
      );
    }

    if (rawLayer.validation?.schemaId !== assetDiscoveryValidationSchemaId) {
      throw createDiscoveryError(
        "invalid_asset_discovery_validation_schema",
        `Expected ${assetDiscoveryValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "indexedRecordsExist",
      "searchResultsDeterministic",
      "noInvalidReferences",
      "noSourceMutation",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createDiscoveryError(
          "asset_discovery_layer_validation_failed",
          `Asset discovery validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetDiscoveryLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_discovery_layer_validation_failed",
      message: error.message,
      assetDiscoveryLayer: null
    });
  }
}

export function validateAssetSearchResult(rawResult) {
  try {
    if (rawResult?.schemaId !== assetSearchResultSchemaId) {
      throw createDiscoveryError(
        "invalid_asset_search_result_schema",
        `Expected ${assetSearchResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (typeof rawResult.assetId !== "string" || rawResult.assetId.trim().length === 0) {
      throw createDiscoveryError(
        "invalid_asset_search_result_asset_id",
        "Search result must include assetId."
      );
    }

    if (!Number.isFinite(rawResult.relevanceScore)) {
      throw createDiscoveryError(
        "invalid_asset_search_result_relevance",
        "Search result must include a numeric relevanceScore."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetSearchResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_search_result_validation_failed",
      message: error.message,
      assetSearchResult: null
    });
  }
}

function buildSourceContext(
  registry,
  variantSystem,
  versioningLayer,
  dependencyLayer,
  releaseLayer,
  options
) {
  const recipePacks = [
    createNatureAssetPack(),
    createCivicAssetPack(),
    createTransportAssetPack(),
    createRoadAndStreetAssetPack(),
    createCommercialAssetPack(),
    createResidentialAssetPack()
  ];

  const recipeMap = new Map();
  const familyCategoryMap = new Map();
  for (const pack of recipePacks) {
    for (const recipe of pack.recipes) {
      recipeMap.set(recipe.recipeId, deepFreeze({ ...recipe }));
    }
    for (const family of pack.assetFamilies) {
      familyCategoryMap.set(family, deriveCategoryFromPackId(pack.packId));
    }
  }

  for (const record of registry.records) {
    if (!recipeMap.has(record.recipeId)) {
      recipeMap.set(
        record.recipeId,
        deepFreeze({
          recipeId: record.recipeId,
          recipeType: "REGISTRY_DISCOVERY_RECIPE_REFERENCE",
          supportedFamilies: deepFreeze([record.assetFamily])
        })
      );
    }
  }

  const releaseRecords = resolveReleaseRecords(options, releaseLayer);
  const versionRecords = buildVersionRecords(registry.records, versioningLayer);

  return deepFreeze({
    registry,
    variantSystem,
    versionRecords,
    dependencyLayer,
    releaseRecords,
    recipes: deepFreeze([...recipeMap.values()].sort((left, right) => left.recipeId.localeCompare(right.recipeId))),
    familyCategoryMap
  });
}

function resolveReleaseRecords(options, releaseLayer) {
  if (Array.isArray(options.releaseRecords)) {
    return deepFreeze([...options.releaseRecords]);
  }

  const baseRecord = releaseLayer.createReleaseRecord({
    assetIds: [defaultAssetId]
  });
  return deepFreeze([baseRecord]);
}

function buildVersionRecords(registryRecords, versioningLayer) {
  return deepFreeze(
    registryRecords.map((record) => {
      try {
        return versioningLayer.createVersionRecord({
          assetId: record.assetId
        });
      } catch {
        return deepFreeze({
          schemaId: "ASSET_DISCOVERY_VERSION_REFERENCE_001",
          versionRecordId: `ASSET_DISCOVERY_VERSION_${record.assetId}`,
          assetId: record.assetId,
          versionNumber: record.version,
          versionState: "DISCOVERABLE",
          activeStatus: false,
          validation: null
        });
      }
    })
  );
}

function buildSearchIndex(sourceContext) {
  const versionByAssetId = new Map(
    sourceContext.versionRecords.map((record) => [record.assetId, record])
  );
  const releasesByAssetId = new Map();
  for (const release of sourceContext.releaseRecords) {
    for (const assetId of release.assetList) {
      if (!releasesByAssetId.has(assetId)) {
        releasesByAssetId.set(assetId, []);
      }
      releasesByAssetId.get(assetId).push(release);
    }
  }

  const variantDefsByAsset = new Map();
  for (const definition of sourceContext.variantSystem.definitions) {
    const keys = [
      definition.baseAssetId,
      definition.targetAssetId
    ].filter(Boolean);
    for (const key of keys) {
      if (!variantDefsByAsset.has(key)) {
        variantDefsByAsset.set(key, []);
      }
      variantDefsByAsset.get(key).push(definition);
    }
  }

  const docs = sourceContext.registry.records.map((record) => {
    const versionRecord = versionByAssetId.get(record.assetId) ?? null;
    const relatedRecipes = collectRelatedRecipes(record, sourceContext, variantDefsByAsset);
    const relatedAssets = collectRelatedAssetIds(record.assetId, sourceContext, variantDefsByAsset);
    const variants = (variantDefsByAsset.get(record.assetId) ?? []).map((definition) => definition.variantId);
    const category = sourceContext.familyCategoryMap.get(record.assetFamily) ?? "general";
    const usageContext = deepFreeze([...record.usageRules].sort((left, right) => left.localeCompare(right)));
    const biomeTerms = collectBiomeTerms(record, variantDefsByAsset.get(record.assetId) ?? []);
    const lifecycleStatus = deriveLifecycleStatus(record, versionRecord, releasesByAssetId.get(record.assetId) ?? []);

    return deepFreeze({
      assetId: record.assetId,
      assetFamily: record.assetFamily,
      assetType: record.assetType,
      category,
      recipeId: record.recipeId,
      variants: deepFreeze([...new Set(variants)].sort((left, right) => left.localeCompare(right))),
      version: versionRecord?.versionNumber ?? record.version,
      status: lifecycleStatus,
      usageContext,
      biomeTerms,
      relatedRecipes,
      relatedAssets,
      searchTokens: buildSearchTokens(
        record,
        category,
        usageContext,
        biomeTerms,
        relatedRecipes,
        variants,
        versionRecord?.versionNumber ?? record.version,
        lifecycleStatus
      )
    });
  });

  return deepFreeze(
    docs.sort((left, right) => left.assetId.localeCompare(right.assetId))
  );
}

function collectRelatedRecipes(record, sourceContext, variantDefs) {
  const relatedRecipes = new Set([record.recipeId]);

  for (const dependency of sourceContext.dependencyLayer.listDependenciesFor(record.assetId)) {
    if (dependency.dependencyType === "ASSET_USES_RECIPE") {
      relatedRecipes.add(dependency.targetId);
    }
  }

  for (const definition of variantDefs ?? []) {
    if (definition.baseReferenceType === "recipe") {
      relatedRecipes.add(definition.baseReferenceId);
    }
  }

  return deepFreeze([...relatedRecipes].sort((left, right) => left.localeCompare(right)));
}

function collectRelatedAssetIds(assetId, sourceContext, variantDefsByAsset) {
  const related = new Set();

  for (const dependency of sourceContext.dependencyLayer.listDependenciesFor(assetId)) {
    if (!dependency.targetId.startsWith("ENVIRONMENT::") && !dependency.targetId.startsWith("ATLAS::")) {
      if (!dependency.targetId.includes("RECIPE") && !dependency.targetId.startsWith("VARIANT::")) {
        related.add(dependency.targetId);
      }
    }
  }

  for (const dependency of sourceContext.dependencyLayer.dependencyRecords) {
    if (dependency.targetId === assetId && !dependency.sourceId.includes("RECIPE")) {
      if (!dependency.sourceId.startsWith("VARIANT::")) {
        related.add(dependency.sourceId);
      }
    }
  }

  for (const definition of variantDefsByAsset.get(assetId) ?? []) {
    related.add(definition.targetAssetId);
    if (definition.baseAssetId) {
      related.add(definition.baseAssetId);
    }
  }

  related.delete(assetId);
  return deepFreeze([...related].sort((left, right) => left.localeCompare(right)));
}

function collectBiomeTerms(record, variantDefinitions) {
  const terms = new Set();

  for (const usageRule of record.usageRules) {
    const upper = usageRule.toUpperCase();
    if (
      upper.includes("COASTAL") ||
      upper.includes("FOREST") ||
      upper.includes("BEACH") ||
      upper.includes("RURAL") ||
      upper.includes("SUBURBAN") ||
      upper.includes("URBAN") ||
      upper.includes("PARK")
    ) {
      terms.add(upper);
    }
  }

  for (const definition of variantDefinitions) {
    for (const biome of definition.conditions.biome ?? []) {
      terms.add(String(biome).toUpperCase());
    }
  }

  return deepFreeze([...terms].sort((left, right) => left.localeCompare(right)));
}

function deriveLifecycleStatus(record, versionRecord, releases) {
  if (releases.some((release) => ["READY", "RELEASED", "ARCHIVED"].includes(release.releaseStatus))) {
    return "RELEASE_TRACKED";
  }
  if (versionRecord?.versionState === "PUBLISHED") {
    return "PUBLISHED";
  }
  return String(record.metadata?.onboardingSource ? "REGISTERED" : "DISCOVERABLE");
}

function buildSearchTokens(
  record,
  category,
  usageContext,
  biomeTerms,
  relatedRecipes,
  variants,
  version,
  lifecycleStatus
) {
  const values = [
    record.assetId,
    record.assetFamily,
    record.assetType,
    category,
    record.recipeId,
    version,
    lifecycleStatus,
    ...usageContext,
    ...biomeTerms,
    ...relatedRecipes,
    ...variants,
    ...(record.atlasCompatibility?.supportedObjectTypes ?? []),
    ...(record.atlasCompatibility?.supportedClassifications ?? []),
    ...(record.tags ?? [])
  ];

  return deepFreeze(
    [...new Set(values.map((value) => String(value).toUpperCase()))]
      .sort((left, right) => left.localeCompare(right))
  );
}

function searchAssetIndex(rawQuery, sourceContext, searchIndex) {
  const query = normalizeQuery(rawQuery);
  const beforeHash = computeDeterministicHash(searchIndex.map((entry) => entry.assetId));
  const matches = searchIndex
    .map((entry) => buildSearchResult(entry, query, sourceContext))
    .filter((result) => result !== null)
    .sort(compareSearchResults);
  const afterHash = computeDeterministicHash(searchIndex.map((entry) => entry.assetId));

  if (beforeHash !== afterHash) {
    throw createDiscoveryError(
      "asset_discovery_source_mutation_detected",
      "Asset discovery search mutated the source index."
    );
  }

  return deepFreeze(matches);
}

function buildSearchResult(entry, query, sourceContext) {
  const matchingFields = [];
  let relevanceScore = 0;

  if (query.text) {
    const textMatches = matchTextQuery(entry, query.text);
    if (textMatches.length === 0) {
      return null;
    }
    matchingFields.push(...textMatches);
    relevanceScore += scoreMatches(textMatches);
  }

  if (query.category) {
    if (entry.category !== query.category) {
      return null;
    }
    matchingFields.push("category");
    relevanceScore += 40;
  }

  if (query.variant) {
    if (!entry.variants.includes(query.variant)) {
      return null;
    }
    matchingFields.push("variant");
    relevanceScore += 35;
  }

  if (query.assetFamily) {
    if (entry.assetFamily !== query.assetFamily) {
      return null;
    }
    matchingFields.push("assetFamily");
    relevanceScore += 30;
  }

  if (query.status) {
    if (entry.status !== query.status) {
      return null;
    }
    matchingFields.push("status");
    relevanceScore += 20;
  }

  if (query.recipeId) {
    if (!entry.relatedRecipes.includes(query.recipeId)) {
      return null;
    }
    matchingFields.push("recipeId");
    relevanceScore += 25;
  }

  if (query.version) {
    if (entry.version !== query.version) {
      return null;
    }
    matchingFields.push("version");
    relevanceScore += 20;
  }

  if (query.biome) {
    if (!entry.biomeTerms.includes(query.biome)) {
      return null;
    }
    matchingFields.push("biome");
    relevanceScore += 15;
  }

  if (query.usageContext) {
    const normalizedUsage = query.usageContext;
    if (!entry.usageContext.some((value) => value.toUpperCase().includes(normalizedUsage))) {
      return null;
    }
    matchingFields.push("usageContext");
    relevanceScore += 15;
  }

  if (matchingFields.length === 0) {
    return null;
  }

  const result = deepFreeze({
    schemaId: assetSearchResultSchemaId,
    assetId: entry.assetId,
    matchingFields: deepFreeze([...new Set(matchingFields)].sort((left, right) => left.localeCompare(right))),
    relevanceScore,
    lifecycleStatus: entry.status,
    relatedRecipes: entry.relatedRecipes,
    relatedAssets: entry.relatedAssets
  });

  const checked = validateAssetSearchResult(result);
  if (!checked.ok) {
    throw createDiscoveryError(checked.errorCode, checked.message);
  }

  return result;
}

function matchTextQuery(entry, text) {
  const matches = [];
  if (entry.assetId.includes(text)) {
    matches.push("assetId");
  }
  if (entry.assetFamily.includes(text)) {
    matches.push("assetFamily");
  }
  if (entry.category.includes(text.toLowerCase())) {
    matches.push("category");
  }
  if (entry.recipeId.includes(text)) {
    matches.push("recipeId");
  }
  if (entry.variants.some((variant) => variant.includes(text.toLowerCase()))) {
    matches.push("variant");
  }
  if (entry.status.includes(text)) {
    matches.push("status");
  }
  if (entry.version.includes(text)) {
    matches.push("version");
  }
  if (entry.usageContext.some((value) => value.toUpperCase().includes(text))) {
    matches.push("usageContext");
  }
  if (entry.biomeTerms.some((value) => value.includes(text))) {
    matches.push("biome");
  }
  return matches;
}

function scoreMatches(matches) {
  let score = 0;
  for (const field of matches) {
    switch (field) {
      case "assetId":
        score += 100;
        break;
      case "assetFamily":
      case "recipeId":
        score += 60;
        break;
      case "variant":
      case "category":
        score += 40;
        break;
      default:
        score += 15;
        break;
    }
  }
  return score;
}

function getRelatedAssetsFor(assetId, sourceContext, searchIndex) {
  const normalizedAssetId = normalizeString(assetId, "assetId");
  const entry = searchIndex.find((candidate) => candidate.assetId === normalizedAssetId);
  if (!entry) {
    return deepFreeze([]);
  }

  return deepFreeze(
    entry.relatedAssets
      .map((relatedAssetId) =>
        deepFreeze({
          assetId: relatedAssetId,
          relatedBy: deriveRelationReason(normalizedAssetId, relatedAssetId, sourceContext)
        })
      )
      .sort((left, right) => left.assetId.localeCompare(right.assetId))
  );
}

function deriveRelationReason(assetId, relatedAssetId, sourceContext) {
  for (const dependency of sourceContext.dependencyLayer.dependencyRecords) {
    if (
      (dependency.sourceId === assetId && dependency.targetId === relatedAssetId) ||
      (dependency.sourceId === relatedAssetId && dependency.targetId === assetId)
    ) {
      return dependency.dependencyType;
    }
  }

  for (const definition of sourceContext.variantSystem.definitions) {
    if (
      definition.targetAssetId === relatedAssetId &&
      definition.baseAssetId === assetId
    ) {
      return "VARIANT_DEPENDS_ON_ASSET";
    }
  }

  return "RELATED_ASSET";
}

function buildDiscoveryValidation(sourceContext, searchIndex) {
  const indexedRecordsExist =
    sourceContext.registry.records.length > 0 &&
    sourceContext.recipes.length > 0 &&
    sourceContext.variantSystem.definitions.length > 0 &&
    sourceContext.versionRecords.length > 0 &&
    sourceContext.dependencyLayer.dependencyRecords.length > 0 &&
    sourceContext.releaseRecords.length > 0;

  const deterministicProbeA = searchAssetIndex({ query: defaultAssetId }, sourceContext, searchIndex);
  const deterministicProbeB = searchAssetIndex({ query: defaultAssetId }, sourceContext, searchIndex);
  const searchResultsDeterministic = JSON.stringify(deterministicProbeA) === JSON.stringify(deterministicProbeB);

  const assetIds = new Set(sourceContext.registry.records.map((record) => record.assetId));
  const recipeIds = new Set(sourceContext.recipes.map((recipe) => recipe.recipeId));
  const noInvalidReferences = searchIndex.every((entry) =>
    entry.relatedRecipes.every((recipeId) => recipeIds.has(recipeId)) &&
    entry.relatedAssets.every((assetId) => assetIds.has(assetId))
  );

  const beforeHash = computeDeterministicHash(buildSourceSignature(sourceContext));
  const afterHash = computeDeterministicHash(buildSourceSignature(sourceContext));
  const noSourceMutation = beforeHash === afterHash;
  const validationPassed =
    indexedRecordsExist &&
    searchResultsDeterministic &&
    noInvalidReferences &&
    noSourceMutation;

  return deepFreeze({
    schemaId: assetDiscoveryValidationSchemaId,
    indexedRecordsExist,
    searchResultsDeterministic,
    noInvalidReferences,
    noSourceMutation,
    validationPassed,
    deterministicSearchHash: computeDeterministicHash(searchIndex.map((entry) => [
      entry.assetId,
      entry.assetFamily,
      entry.category,
      entry.recipeId,
      entry.variants,
      entry.version,
      entry.status,
      entry.relatedRecipes,
      entry.relatedAssets
    ]))
  });
}

function buildSourceSignature(sourceContext) {
  return [
    sourceContext.registry.records.map((record) => record.assetId),
    sourceContext.recipes.map((recipe) => recipe.recipeId),
    sourceContext.variantSystem.validation?.deterministicVariantHash,
    sourceContext.versionRecords.map((record) => record.validation?.deterministicVersionHash),
    sourceContext.dependencyLayer.validation?.deterministicGraphHash,
    sourceContext.releaseRecords.map((record) => record.validation?.deterministicReleaseHash)
  ];
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({});
  }
  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createDiscoveryError(
      "invalid_asset_discovery_options",
      "Asset discovery options must be an object when provided."
    );
  }
  return deepFreeze({ ...rawOptions });
}

function normalizeRegistry(rawRegistry) {
  const checked = validateAssetFactoryRegistryLayer(rawRegistry);
  if (!checked.ok) {
    throw createDiscoveryError(checked.errorCode, checked.message);
  }
  return rawRegistry;
}

function normalizeVariantSystem(rawSystem) {
  const checked = validateAssetVariantSystem(rawSystem);
  if (!checked.ok) {
    throw createDiscoveryError(checked.errorCode, checked.message);
  }
  return rawSystem;
}

function normalizeVersioningLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_VERSIONING_LAYER_001" ||
    typeof rawLayer.createVersionRecord !== "function"
  ) {
    throw createDiscoveryError(
      "invalid_asset_discovery_versioning_layer",
      "Asset discovery requires a valid versioning layer."
    );
  }
  return rawLayer;
}

function normalizeDependencyLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_DEPENDENCY_MANAGEMENT_LAYER_001" ||
    typeof rawLayer.listDependenciesFor !== "function"
  ) {
    throw createDiscoveryError(
      "invalid_asset_discovery_dependency_layer",
      "Asset discovery requires a valid dependency layer."
    );
  }
  for (const record of rawLayer.dependencyRecords) {
    const checked = validateAssetDependencyRecord(record);
    if (!checked.ok) {
      throw createDiscoveryError(checked.errorCode, checked.message);
    }
  }
  return rawLayer;
}

function normalizeReleaseLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_RELEASE_MANAGEMENT_LAYER_001" ||
    typeof rawLayer.createReleaseRecord !== "function"
  ) {
    throw createDiscoveryError(
      "invalid_asset_discovery_release_layer",
      "Asset discovery requires a valid release layer."
    );
  }
  return rawLayer;
}

function normalizeQuery(rawQuery) {
  if (typeof rawQuery === "string") {
    return deepFreeze({ text: rawQuery.trim().toUpperCase() });
  }
  if (rawQuery == null) {
    return deepFreeze({ text: defaultAssetId });
  }
  if (typeof rawQuery !== "object" || Array.isArray(rawQuery)) {
    throw createDiscoveryError(
      "invalid_asset_discovery_query",
      "Asset discovery query must be a string or object."
    );
  }

  const text =
    typeof rawQuery.query === "string" && rawQuery.query.trim().length > 0
      ? rawQuery.query.trim().toUpperCase()
      : typeof rawQuery.text === "string" && rawQuery.text.trim().length > 0
        ? rawQuery.text.trim().toUpperCase()
        : null;

  return deepFreeze({
    text,
    category:
      typeof rawQuery.category === "string" && rawQuery.category.trim().length > 0
        ? rawQuery.category.trim().toLowerCase()
        : null,
    variant:
      typeof rawQuery.variant === "string" && rawQuery.variant.trim().length > 0
        ? rawQuery.variant.trim().toLowerCase()
        : null,
    assetFamily:
      typeof rawQuery.assetFamily === "string" && rawQuery.assetFamily.trim().length > 0
        ? rawQuery.assetFamily.trim().toUpperCase()
        : null,
    status:
      typeof rawQuery.status === "string" && rawQuery.status.trim().length > 0
        ? rawQuery.status.trim().toUpperCase()
        : null,
    version:
      typeof rawQuery.version === "string" && rawQuery.version.trim().length > 0
        ? rawQuery.version.trim()
        : null,
    recipeId:
      typeof rawQuery.recipeId === "string" && rawQuery.recipeId.trim().length > 0
        ? rawQuery.recipeId.trim().toUpperCase()
        : null,
    biome:
      typeof rawQuery.biome === "string" && rawQuery.biome.trim().length > 0
        ? rawQuery.biome.trim().toUpperCase()
        : null,
    usageContext:
      typeof rawQuery.usageContext === "string" && rawQuery.usageContext.trim().length > 0
        ? rawQuery.usageContext.trim().toUpperCase()
        : null
  });
}

function deriveCategoryFromPackId(packId) {
  if (packId.includes("NATURE")) {
    return "nature";
  }
  if (packId.includes("CIVIC")) {
    return "buildings";
  }
  if (packId.includes("TRANSPORT")) {
    return "transport";
  }
  if (packId.includes("ROAD_AND_STREET")) {
    return "roads";
  }
  if (packId.includes("COMMERCIAL")) {
    return "commercial";
  }
  if (packId.includes("RESIDENTIAL")) {
    return "residential";
  }
  return "general";
}

function compareSearchResults(left, right) {
  return (
    right.relevanceScore - left.relevanceScore ||
    left.assetId.localeCompare(right.assetId)
  );
}

function normalizeString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createDiscoveryError(`invalid_${label}`, `${label} must be a non-empty string.`);
  }
  return value.trim().toUpperCase();
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createDiscoveryError(code, message) {
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
