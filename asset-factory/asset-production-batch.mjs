import { createHash } from "node:crypto";

import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetProductionQueueLayer } from "./asset-production-queue.mjs";

export const assetProductionBatchLayerSchemaId = "ASSET_PRODUCTION_BATCH_LAYER_001";
export const assetProductionBatchSchemaId = "ASSET_PRODUCTION_BATCH_001";
export const assetProductionBatchValidationSchemaId =
  "ASSET_PRODUCTION_BATCH_VALIDATION_001";

const batchBlueprints = deepFreeze([
  batchBlueprint({
    batchId: "TOWN_MAIN_STREET_BATCH_001",
    batchType: "TOWN_MAIN_STREET_BATCH",
    assetIds: [
      "BUILDING_COMMERCIAL_SMALL_SHOP_001",
      "BUILDING_COMMERCIAL_BAKERY_SMALL_001",
      "BUILDING_COMMERCIAL_RETAIL_SHOP_001",
      "ROAD_SURFACE_RESIDENTIAL_STREET_001",
      "SIDEWALK_CURB_CROSSING_001",
      "STREET_FURNITURE_STANDARD_SET_001",
      "ROAD_DETAIL_MARKING_SET_001"
    ],
    reason:
      "Creates a first complete main-street kit by combining commercial frontage, street structure, and public-realm detail in one batch.",
    dependencies: [
      dependencyRecord("anchor_asset", "ROAD_SURFACE_RESIDENTIAL_STREET_001"),
      dependencyRecord("public_realm_support", "SIDEWALK_CURB_CROSSING_001"),
      dependencyRecord("public_realm_support", "STREET_FURNITURE_STANDARD_SET_001")
    ],
    environmentTags: ["TOWN_CENTRE", "MAIN_STREET", "COMMERCIAL_FRONTAGE"]
  }),
  batchBlueprint({
    batchId: "CIVIC_LOCATION_BATCH_001",
    batchType: "CIVIC_LOCATION_BATCH",
    assetIds: [
      "BUILDING_CIVIC_SPORTS_PAVILION_001",
      "BUILDING_CIVIC_SCHOOL_PRIMARY_001",
      "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001",
      "PARK_TREATMENT_GREENERY_SET_001",
      "RESIDENTIAL_DETAIL_GARDEN_SET_001"
    ],
    reason:
      "Builds a reusable civic-and-recreation location group with an anchor pavilion, civic support, access infrastructure, fence-capable detail, and surrounding greenery.",
    dependencies: [
      dependencyRecord("anchor_asset", "BUILDING_CIVIC_SPORTS_PAVILION_001"),
      dependencyRecord("access_support", "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001"),
      dependencyRecord("landscape_support", "PARK_TREATMENT_GREENERY_SET_001"),
      dependencyRecord("boundary_support", "RESIDENTIAL_DETAIL_GARDEN_SET_001")
    ],
    environmentTags: ["CIVIC_CAMPUS", "SPORTS_GROUND", "RECREATION_EDGE"]
  }),
  batchBlueprint({
    batchId: "COASTAL_LOCATION_BATCH_001",
    batchType: "COASTAL_LOCATION_BATCH",
    assetIds: [
      "GROUND_BEACH_SAND_001",
      "TREE_COASTAL_001",
      "ROCK_COASTAL_001",
      "BUILDING_RESIDENTIAL_HOUSE_COASTAL_001",
      "BUILDING_COMMERCIAL_CAFE_COASTAL_001"
    ],
    reason:
      "Forms a first coastal destination set by combining shoreline ground treatment, vegetation, rock edge treatment, and both residential and visitor-facing buildings.",
    dependencies: [
      dependencyRecord("shoreline_anchor", "GROUND_BEACH_SAND_001"),
      dependencyRecord("environment_support", "TREE_COASTAL_001"),
      dependencyRecord("environment_support", "ROCK_COASTAL_001")
    ],
    environmentTags: ["COASTAL_EDGE", "FORESHORE", "VISITOR_NODE"]
  })
]);

export function createAssetProductionBatchLayer(
  rawOptions = {},
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawQueueLayer = createAssetProductionQueueLayer()
) {
  const registry = normalizeRegistry(rawRegistry);
  const queueLayer = normalizeQueueLayer(rawQueueLayer);
  const options = normalizeBatchOptions(rawOptions);

  const batchSet = buildAssetProductionBatchSet(options, registry, queueLayer);
  const validation = buildAssetProductionBatchValidation(batchSet, registry);

  const layer = deepFreeze({
    schemaId: assetProductionBatchLayerSchemaId,
    layerId: "ASSET_PRODUCTION_BATCH_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    queueLayerId: queueLayer.layerId,
    batchSet,
    validation,
    getBatchById(batchId) {
      return this.batchSet.batches.find((batch) => batch.batchId === normalizeString(batchId)) ?? null;
    },
    listBatches() {
      return [...this.batchSet.batches];
    }
  });

  const checked = validateAssetProductionBatchLayer(layer);
  if (!checked.ok) {
    throw createBatchValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetProductionBatchLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetProductionBatchLayerSchemaId) {
      throw createBatchValidationError(
        "invalid_asset_production_batch_layer_schema",
        `Expected ${assetProductionBatchLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.batchSet?.schemaId !== assetProductionBatchSchemaId) {
      throw createBatchValidationError(
        "invalid_asset_production_batch_schema",
        `Expected ${assetProductionBatchSchemaId} but received ${rawLayer.batchSet?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetProductionBatchValidationSchemaId) {
      throw createBatchValidationError(
        "invalid_asset_production_batch_validation_schema",
        `Expected ${assetProductionBatchValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "assetsExist",
      "dependenciesValid",
      "noDuplicateBatchEntries",
      "deterministicOrdering",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createBatchValidationError(
          "asset_production_batch_layer_validation_failed",
          `Asset production batch validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetProductionBatchLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_production_batch_layer_validation_failed",
      message: error.message,
      assetProductionBatchLayer: null
    });
  }
}

export function validateAssetProductionBatchSet(rawBatchSet) {
  try {
    if (rawBatchSet?.schemaId !== assetProductionBatchSchemaId) {
      throw createBatchValidationError(
        "invalid_asset_production_batch_schema",
        `Expected ${assetProductionBatchSchemaId} but received ${rawBatchSet?.schemaId}.`
      );
    }

    if (rawBatchSet.validation?.schemaId !== assetProductionBatchValidationSchemaId) {
      throw createBatchValidationError(
        "invalid_asset_production_batch_validation_schema",
        `Expected ${assetProductionBatchValidationSchemaId} but received ${rawBatchSet.validation?.schemaId}.`
      );
    }

    const derivedValidation = buildAssetProductionBatchValidation(
      rawBatchSet,
      createAssetFactoryRegistryLayer()
    );

    for (const key of [
      "assetsExist",
      "dependenciesValid",
      "noDuplicateBatchEntries",
      "deterministicOrdering",
      "validationPassed"
    ]) {
      if (derivedValidation[key] !== true) {
        throw createBatchValidationError(
          "asset_production_batch_validation_failed",
          `Asset production batch validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(
      rawBatchSet.batches.map((batch) => [
        batch.recommendedOrder,
        batch.batchId,
        batch.batchType,
        batch.batchPriorityScore,
        batch.expectedReuse.score,
        batch.assetList.map((asset) => asset.assetId),
        batch.dependencies.map((dependency) => [
          dependency.dependencyType,
          dependency.targetId
        ])
      ])
    );

    if (expectedHash !== rawBatchSet.validation.deterministicBatchHash) {
      throw createBatchValidationError(
        "asset_production_batch_hash_mismatch",
        "Asset production batch deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetProductionBatchSet: rawBatchSet
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_production_batch_validation_failed",
      message: error.message,
      assetProductionBatchSet: null
    });
  }
}

function buildAssetProductionBatchSet(options, registry, queueLayer) {
  const queueEntriesByAssetId = new Map(
    queueLayer.queue.entries.map((entry) => [entry.assetId, entry])
  );
  const selectedBlueprints = resolveBlueprints(options.batchIds);

  const batches = selectedBlueprints
    .map((blueprint) => buildBatchRecord(blueprint, registry, queueEntriesByAssetId))
    .sort(compareBatchRecords)
    .map((batch, index) =>
      deepFreeze({
        ...batch,
        recommendedOrder: index + 1
      })
    );

  const validation = buildAssetProductionBatchValidation(
    {
      schemaId: assetProductionBatchSchemaId,
      batchSetId: "ASSET_PRODUCTION_BATCH_001_DEFAULT",
      batches
    },
    registry
  );

  return deepFreeze({
    schemaId: assetProductionBatchSchemaId,
    batchSetId: "ASSET_PRODUCTION_BATCH_001_DEFAULT",
    batches,
    summary: deepFreeze({
      batchCount: batches.length,
      totalAssetCount: batches.reduce((sum, batch) => sum + batch.assetList.length, 0),
      topPriorityBatchId: batches[0]?.batchId ?? null
    }),
    validation
  });
}

function buildBatchRecord(blueprint, registry, queueEntriesByAssetId) {
  const assetList = blueprint.assetIds.map((assetId) => {
    const registryAsset = registry.getAssetById(assetId);
    if (!registryAsset) {
      throw createBatchValidationError(
        "missing_asset_production_batch_asset",
        `Asset ${assetId} does not exist in the Asset Factory registry.`
      );
    }

    const queueEntry = queueEntriesByAssetId.get(assetId);
    if (!queueEntry) {
      throw createBatchValidationError(
        "missing_asset_production_batch_queue_entry",
        `Asset ${assetId} does not exist in the Asset Factory production queue.`
      );
    }

    return deepFreeze({
      assetId: registryAsset.assetId,
      assetType: registryAsset.assetType,
      pack: queueEntry.pack,
      priorityScore: queueEntry.priorityScore,
      reuseValue: queueEntry.reuseValue,
      demandReason: queueEntry.demandReason
    });
  });

  const dependencyAssetIds = blueprint.dependencies.map((dependency) => dependency.targetId);
  const batchPriorityScore = Math.round(
    assetList.reduce((sum, asset) => sum + asset.priorityScore, 0) / assetList.length
  );
  const expectedReuseScore = clampScore(
    Math.round(
      assetList.reduce((sum, asset) => sum + asset.reuseValue, 0) / assetList.length +
        new Set(assetList.map((asset) => asset.pack)).size * 3
    )
  );

  return deepFreeze({
    batchId: blueprint.batchId,
    batchType: blueprint.batchType,
    assetList,
    reason: blueprint.reason,
    dependencies: deepFreeze(
      blueprint.dependencies.map((dependency) => ({
        ...dependency,
        valid: dependencyAssetIds.includes(dependency.targetId)
      }))
    ),
    expectedReuse: deepFreeze({
      score: expectedReuseScore,
      classification: classifyExpectedReuse(expectedReuseScore)
    }),
    environmentTags: blueprint.environmentTags,
    batchPriorityScore
  });
}

function buildAssetProductionBatchValidation(rawBatchSet, registry) {
  const batches = rawBatchSet.batches ?? [];
  const batchAssetIds = batches.flatMap((batch) => batch.assetList.map((asset) => asset.assetId));
  const batchIds = batches.map((batch) => batch.batchId);
  const assetsExist = batchAssetIds.every((assetId) => registry.getAssetById(assetId));
  const dependenciesValid = batches.every((batch) =>
    batch.dependencies.every((dependency) => {
      if (dependency.dependencyType === "batch_dependency") {
        return batchIds.includes(dependency.targetId);
      }
      return registry.getAssetById(dependency.targetId) !== null;
    })
  );
  const noDuplicateBatchEntries = new Set(batchAssetIds).size === batchAssetIds.length;
  const deterministicOrdering = batches.every(
    (batch, index) => batch.recommendedOrder === undefined || batch.recommendedOrder === index + 1
  );
  const validationPassed =
    assetsExist &&
    dependenciesValid &&
    noDuplicateBatchEntries &&
    deterministicOrdering;

  return deepFreeze({
    schemaId: assetProductionBatchValidationSchemaId,
    assetsExist,
    dependenciesValid,
    noDuplicateBatchEntries,
    deterministicOrdering,
    validationPassed,
    deterministicBatchHash: computeDeterministicHash(
      batches.map((batch) => [
        batch.recommendedOrder ?? 0,
        batch.batchId,
        batch.batchType,
        batch.batchPriorityScore,
        batch.expectedReuse.score,
        batch.assetList.map((asset) => asset.assetId),
        batch.dependencies.map((dependency) => [
          dependency.dependencyType,
          dependency.targetId
        ])
      ])
    )
  });
}

function resolveBlueprints(batchIds) {
  if (!batchIds) {
    return batchBlueprints;
  }

  const blueprintsById = new Map(batchBlueprints.map((blueprint) => [blueprint.batchId, blueprint]));
  return batchIds.map((batchId) => {
    const blueprint = blueprintsById.get(batchId);
    if (!blueprint) {
      throw createBatchValidationError(
        "missing_asset_production_batch_blueprint",
        `Batch ${batchId} is not defined in the production batch layer.`
      );
    }
    return blueprint;
  });
}

function compareBatchRecords(left, right) {
  if (left.batchPriorityScore !== right.batchPriorityScore) {
    return right.batchPriorityScore - left.batchPriorityScore;
  }
  if (left.expectedReuse.score !== right.expectedReuse.score) {
    return right.expectedReuse.score - left.expectedReuse.score;
  }
  return left.batchId.localeCompare(right.batchId);
}

function classifyExpectedReuse(score) {
  if (score >= 90) {
    return "VERY_HIGH";
  }
  if (score >= 75) {
    return "HIGH";
  }
  if (score >= 60) {
    return "MEDIUM";
  }
  return "FOCUSED";
}

function normalizeBatchOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({});
  }

  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createBatchValidationError(
      "invalid_asset_production_batch_options",
      "Asset production batch options must be an object when provided."
    );
  }

  const batchIds = rawOptions.batchIds
    ? uniqueSorted(rawOptions.batchIds.map((batchId) => normalizeString(batchId)))
    : null;

  return deepFreeze({
    batchIds
  });
}

function normalizeRegistry(rawRegistry) {
  if (rawRegistry?.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001") {
    throw createBatchValidationError(
      "invalid_asset_production_batch_registry",
      "Asset production batch layer requires a valid Asset Factory registry layer."
    );
  }
  return rawRegistry;
}

function normalizeQueueLayer(rawQueueLayer) {
  if (rawQueueLayer?.schemaId !== "ASSET_PRODUCTION_QUEUE_LAYER_001") {
    throw createBatchValidationError(
      "invalid_asset_production_batch_queue",
      "Asset production batch layer requires a valid Asset Factory production queue layer."
    );
  }
  return rawQueueLayer;
}

function batchBlueprint(definition) {
  return deepFreeze({
    batchId: normalizeString(definition.batchId),
    batchType: normalizeString(definition.batchType),
    assetIds: deepFreeze(definition.assetIds.map((assetId) => normalizeString(assetId))),
    reason: normalizeSentence(definition.reason, "reason"),
    dependencies: deepFreeze(definition.dependencies.map((dependency) => dependencyRecord(
      dependency.dependencyType,
      dependency.targetId
    ))),
    environmentTags: deepFreeze(definition.environmentTags.map((tag) => normalizeString(tag)))
  });
}

function dependencyRecord(dependencyType, targetId) {
  return deepFreeze({
    dependencyType: normalizeString(dependencyType),
    targetId: normalizeString(targetId)
  });
}

function normalizeSentence(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createBatchValidationError(
      "invalid_asset_production_batch_text",
      `Expected ${fieldName} to be a non-empty string.`
    );
  }
  return value.trim();
}

function normalizeString(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createBatchValidationError(
      "invalid_asset_production_batch_string",
      "Expected a non-empty string."
    );
  }
  return value.trim().toUpperCase();
}

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createBatchValidationError(code, message) {
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
