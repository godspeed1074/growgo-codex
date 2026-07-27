import { createHash } from "node:crypto";

import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetProductionBatchLayer } from "./asset-production-batch.mjs";
import { createAssetCreationPipelineLayer } from "./asset-creation-pipeline.mjs";
import { createAssetCreationSpecificationLayer } from "./asset-creation-specification.mjs";

export const assetProductionSpecificationLayerSchemaId =
  "ASSET_PRODUCTION_SPECIFICATION_LAYER_001";
export const assetProductionSpecificationSchemaId =
  "ASSET_PRODUCTION_SPECIFICATION_001";
export const assetProductionSpecificationValidationSchemaId =
  "ASSET_PRODUCTION_SPECIFICATION_VALIDATION_001";

const defaultBatchId = "CIVIC_LOCATION_BATCH_001";

const batchProductionDefinitions = deepFreeze({
  CIVIC_LOCATION_BATCH_001: deepFreeze({
    batchId: "CIVIC_LOCATION_BATCH_001",
    environmentContext: deepFreeze({
      biome: "SUBURBAN_PARKLAND",
      climate: "TEMPERATE",
      regionProfile: "REGIONAL_TOWN",
      environmentType: "CIVIC_CAMPUS",
      styleProfile: "PAPERCUT_STANDARD"
    }),
    stageAssignments: deepFreeze({
      BUILDING_CIVIC_SPORTS_PAVILION_001: "FOUNDATION_ASSETS",
      BUILDING_CIVIC_SCHOOL_PRIMARY_001: "FOUNDATION_ASSETS",
      TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001: "SUPPORTING_ASSETS",
      PARK_TREATMENT_GREENERY_SET_001: "SUPPORTING_ASSETS",
      RESIDENTIAL_DETAIL_GARDEN_SET_001: "DETAIL_ASSETS"
    }),
    perAssetDefinitions: deepFreeze({
      BUILDING_CIVIC_SPORTS_PAVILION_001: deepFreeze({
        specificationLabel: "BUILDING_CIVIC_SPORTS_PAVILION_001",
        performanceBudgetOverride: {
          polygonBudget: "medium",
          materialBudget: "shared_civic_material",
          instanceFriendly: false
        },
        specification: deepFreeze({
          style: "lightweight sports pavilion with readable shelter massing and civic edge presence",
          footprintCompatibility: deepFreeze([
            "SPORTS_EDGE_FOOTPRINT",
            "OPEN_SPACE_SUPPORT_FOOTPRINT"
          ]),
          civicUsage: deepFreeze([
            "sports-ground anchor",
            "spectator shelter",
            "recreation facility identity"
          ]),
          variants: deepFreeze([
            "sports_pavilion",
            "changing_rooms",
            "recreation_building"
          ]),
          materials: deepFreeze([
            "shared civic wall palette",
            "simple roof canopy treatment",
            "durable sports-facility trim"
          ])
        })
      }),
      TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001: deepFreeze({
        specificationLabel: "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001",
        performanceBudgetOverride: {
          polygonBudget: "low",
          materialBudget: "shared_transport_material",
          instanceFriendly: true
        },
        specification: deepFreeze({
          role: "civic access support and safe arrival infrastructure",
          footprintCompatibility: deepFreeze([
            "ROAD_EDGE_FOOTPRINT",
            "CROSSING_NODE_FOOTPRINT",
            "STREET_FURNITURE_POINT_FOOTPRINT"
          ]),
          variants: deepFreeze([
            "sign",
            "crossing",
            "traffic_furniture",
            "street_infrastructure"
          ]),
          materials: deepFreeze([
            "shared transport metal palette",
            "high-contrast sign surfaces",
            "simple crossing marker treatment"
          ])
        })
      }),
      PARK_TREATMENT_GREENERY_SET_001: deepFreeze({
        specificationLabel: "PARK_TREATMENT_GREENERY_SET_001",
        performanceBudgetOverride: {
          polygonBudget: "low",
          materialBudget: "shared_park_material",
          instanceFriendly: true
        },
        specification: deepFreeze({
          role: "supporting civic greenery and sports-edge landscape treatment",
          biomeCompatibility: deepFreeze([
            "SUBURBAN_PARKLAND",
            "TEMPERATE_GRASSLAND",
            "COASTAL"
          ]),
          variants: deepFreeze([
            "park_landscaping",
            "garden_edge_treatment",
            "recreation_greenery"
          ]),
          materials: deepFreeze([
            "shared park foliage material",
            "low-detail lawn and planting treatment",
            "clear papercut greenery silhouette"
          ])
        })
      }),
      RESIDENTIAL_DETAIL_GARDEN_SET_001: deepFreeze({
        specificationLabel: "RESIDENTIAL_DETAIL_GARDEN_SET_001",
        performanceBudgetOverride: {
          polygonBudget: "low",
          materialBudget: "shared_residential_detail_material",
          instanceFriendly: true
        },
        specification: deepFreeze({
          role: "fencing and frontage detail for civic-edge residential boundaries",
          footprintCompatibility: deepFreeze([
            "FRONT_YARD_FOOTPRINT",
            "DRIVEWAY_EDGE_FOOTPRINT",
            "FENCE_LINE_FOOTPRINT"
          ]),
          variants: deepFreeze([
            "fence",
            "garden",
            "driveway",
            "mailbox"
          ]),
          materials: deepFreeze([
            "shared fence and edging palette",
            "simple driveway surfacing",
            "small-scale frontage detail treatment"
          ])
        })
      })
    })
  })
});

export function createAssetProductionSpecificationLayer(
  rawOptions = {},
  rawBatchLayer = createAssetProductionBatchLayer(),
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawPipeline = createAssetCreationPipelineLayer(rawRegistry),
  rawCreationSpecificationLayer = createAssetCreationSpecificationLayer(
    rawRegistry,
    rawPipeline
  )
) {
  const options = normalizeOptions(rawOptions);
  const batchLayer = normalizeBatchLayer(rawBatchLayer);
  const registry = normalizeRegistry(rawRegistry);
  const pipeline = normalizePipeline(rawPipeline);
  const creationSpecificationLayer = normalizeCreationSpecificationLayer(
    rawCreationSpecificationLayer
  );

  const specification = buildBatchProductionSpecification(
    options.batchId,
    batchLayer,
    registry,
    pipeline,
    creationSpecificationLayer
  );
  const validation = buildBatchProductionSpecificationValidation(specification, registry, batchLayer);

  const layer = deepFreeze({
    schemaId: assetProductionSpecificationLayerSchemaId,
    layerId: "ASSET_PRODUCTION_SPECIFICATION_LAYER_001_DEFAULT",
    batchLayerId: batchLayer.layerId,
    registryId: registry.registryId,
    pipelineId: pipeline.layerId,
    creationSpecificationLayerId: creationSpecificationLayer.layerId,
    specification,
    validation,
    getAssetSpecification(assetId) {
      return (
        this.specification.assetSpecifications.find(
          (entry) => entry.assetId === normalizeString(assetId)
        ) ?? null
      );
    }
  });

  const checked = validateAssetProductionSpecificationLayer(layer);
  if (!checked.ok) {
    throw createProductionSpecificationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetProductionSpecificationLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetProductionSpecificationLayerSchemaId) {
      throw createProductionSpecificationError(
        "invalid_asset_production_specification_layer_schema",
        `Expected ${assetProductionSpecificationLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.specification?.schemaId !== assetProductionSpecificationSchemaId) {
      throw createProductionSpecificationError(
        "invalid_asset_production_specification_schema",
        `Expected ${assetProductionSpecificationSchemaId} but received ${rawLayer.specification?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetProductionSpecificationValidationSchemaId) {
      throw createProductionSpecificationError(
        "invalid_asset_production_specification_validation_schema",
        `Expected ${assetProductionSpecificationValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "assetsExist",
      "batchValid",
      "dependenciesValid",
      "specificationsComplete",
      "deterministicOrdering",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createProductionSpecificationError(
          "asset_production_specification_layer_validation_failed",
          `Asset production specification validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetProductionSpecificationLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_production_specification_layer_validation_failed",
      message: error.message,
      assetProductionSpecificationLayer: null
    });
  }
}

export function validateAssetProductionSpecification(rawSpecification) {
  try {
    if (rawSpecification?.schemaId !== assetProductionSpecificationSchemaId) {
      throw createProductionSpecificationError(
        "invalid_asset_production_specification_schema",
        `Expected ${assetProductionSpecificationSchemaId} but received ${rawSpecification?.schemaId}.`
      );
    }

    if (rawSpecification.validation?.schemaId !== assetProductionSpecificationValidationSchemaId) {
      throw createProductionSpecificationError(
        "invalid_asset_production_specification_validation_schema",
        `Expected ${assetProductionSpecificationValidationSchemaId} but received ${rawSpecification.validation?.schemaId}.`
      );
    }

    const derivedValidation = buildBatchProductionSpecificationValidation(
      rawSpecification,
      createAssetFactoryRegistryLayer(),
      createAssetProductionBatchLayer()
    );

    for (const key of [
      "assetsExist",
      "batchValid",
      "dependenciesValid",
      "specificationsComplete",
      "deterministicOrdering",
      "validationPassed"
    ]) {
      if (derivedValidation[key] !== true) {
        throw createProductionSpecificationError(
          "asset_production_specification_validation_failed",
          `Asset production specification validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildBatchSpecificationSignature(rawSpecification));
    if (expectedHash !== rawSpecification.validation.deterministicSpecificationHash) {
      throw createProductionSpecificationError(
        "asset_production_specification_hash_mismatch",
        "Asset production specification hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetProductionSpecification: rawSpecification
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_production_specification_validation_failed",
      message: error.message,
      assetProductionSpecification: null
    });
  }
}

function buildBatchProductionSpecification(
  batchId,
  batchLayer,
  registry,
  pipeline,
  creationSpecificationLayer
) {
  const batch = batchLayer.getBatchById(batchId);
  if (!batch) {
    throw createProductionSpecificationError(
      "missing_asset_production_batch",
      `Batch ${batchId} does not exist in the Asset Production Batch layer.`
    );
  }

  const definition = batchProductionDefinitions[batchId];
  if (!definition) {
    throw createProductionSpecificationError(
      "missing_asset_production_specification_definition",
      `No production specification definition exists for batch ${batchId}.`
    );
  }

  const assetSpecifications = batch.assetList
    .map((asset, index) =>
      buildAssetWorkPackage(
        asset.assetId,
        index,
        definition,
        batch,
        registry,
        pipeline,
        creationSpecificationLayer
      )
    )
    .sort(compareAssetWorkPackages);

  const creationOrder = buildCreationOrder(assetSpecifications);

  const base = deepFreeze({
    schemaId: assetProductionSpecificationSchemaId,
    specificationId: `${batch.batchId}_SPECIFICATION_001`,
    batchId: batch.batchId,
    batchType: batch.batchType,
    assetList: deepFreeze(assetSpecifications.map((entry) => entry.assetId)),
    assetSpecifications,
    dependencies: deepFreeze(structuredClone(batch.dependencies)),
    creationOrder,
    reason: batch.reason,
    validationRequirements: deepFreeze([
      "assets_exist",
      "batch_valid",
      "dependencies_valid",
      "specifications_complete",
      "deterministic_ordering"
    ]),
    summary: deepFreeze({
      foundationAssetCount: creationOrder.FOUNDATION_ASSETS.length,
      supportingAssetCount: creationOrder.SUPPORTING_ASSETS.length,
      detailAssetCount: creationOrder.DETAIL_ASSETS.length
    }),
    validation: null
  });

  const validation = buildBatchProductionSpecificationValidation(
    base,
    registry,
    batchLayer
  );

  return deepFreeze({
    ...base,
    validation
  });
}

function buildAssetWorkPackage(
  assetId,
  batchIndex,
  batchDefinition,
  batch,
  registry,
  pipeline,
  creationSpecificationLayer
) {
  const stage = batchDefinition.stageAssignments[assetId];
  if (!stage) {
    throw createProductionSpecificationError(
      "missing_asset_production_stage",
      `No production stage assignment exists for asset ${assetId}.`
    );
  }

  const registeredAsset = registry.getAssetById(assetId);
  if (!registeredAsset) {
    throw createProductionSpecificationError(
      "missing_asset_production_registry_asset",
      `Asset ${assetId} does not exist in the Asset Factory registry.`
    );
  }

  const existingSpecification = creationSpecificationLayer.getSpecificationByAssetId(assetId);
  const creationRequest = existingSpecification
    ? existingSpecification.creationRequest
    : buildApprovedCreationRequest(assetId, batchDefinition, pipeline);
  const specificationBody = existingSpecification
    ? existingSpecification.specification
    : batchDefinition.perAssetDefinitions[assetId]?.specification ??
      missingPerAssetDefinition(assetId);
  const specificationLabel = existingSpecification?.specificationLabel ?? assetId;
  const variants = existingSpecification?.variants ??
    batchDefinition.perAssetDefinitions[assetId]?.specification?.variants ??
    registeredAsset.metadata?.supportedVariants ??
    [creationRequest.selectedVariant];
  const performanceBudget = existingSpecification?.performanceBudget ?? creationRequest.performanceBudget;
  const lodRequirements = existingSpecification?.lodRequirements ?? creationRequest.lodRequirements;

  return deepFreeze({
    workPackageId: `${batch.batchId}_${assetId}_WORK_PACKAGE_001`,
    assetId,
    recipeId: creationRequest.recipeId,
    specificationLabel,
    selectedVariant: creationRequest.selectedVariant,
    variants: deepFreeze([...variants]),
    lodRequirements: deepFreeze([...lodRequirements]),
    performanceBudget,
    creationStage: stage,
    creationOrder: stageIndex(stage) * 10 + batchIndex + 1,
    dependencyTargets: deepFreeze(resolveDependencyTargets(assetId, stage, batch)),
    validationRequirements: deepFreeze([
      ...creationRequest.validationRequirements,
      "dependency_order_valid",
      "batch_membership_valid",
      "work_package_complete"
    ]),
    environmentContext: creationRequest.environmentContext,
    creationRequest,
    specification: deepFreeze({
      ...sortKeys(specificationBody)
    }),
    metadata: deepFreeze({
      batchId: batch.batchId,
      assetType: registeredAsset.assetType,
      assetFamily: registeredAsset.assetFamily
    })
  });
}

function buildApprovedCreationRequest(assetId, batchDefinition, pipeline) {
  const perAssetDefinition = batchDefinition.perAssetDefinitions[assetId];
  if (!perAssetDefinition) {
    throw createProductionSpecificationError(
      "missing_asset_production_definition",
      `No production specification body exists for asset ${assetId}.`
    );
  }

  let request = pipeline.createRequest({
    baseAssetId: assetId,
    environmentContext: batchDefinition.environmentContext,
    performanceBudgetOverride: perAssetDefinition.performanceBudgetOverride ?? null
  });

  request = pipeline.advanceRequest(request, "IN_PROGRESS");
  request = pipeline.advanceRequest(request, "VALIDATION_PENDING");
  request = pipeline.advanceRequest(request, "APPROVED");

  return request;
}

function buildCreationOrder(assetSpecifications) {
  const order = {
    FOUNDATION_ASSETS: [],
    SUPPORTING_ASSETS: [],
    DETAIL_ASSETS: []
  };

  for (const entry of assetSpecifications) {
    order[entry.creationStage].push(entry.assetId);
  }

  return deepFreeze(order);
}

function buildBatchProductionSpecificationValidation(specification, registry, batchLayer) {
  const batch = batchLayer.getBatchById(specification.batchId);
  const assetsExist = specification.assetList.every((assetId) => registry.getAssetById(assetId));
  const batchValid = batch !== null;
  const dependencyPool = new Set(specification.assetList);
  const dependenciesValid =
    specification.dependencies.every((dependency) =>
      dependencyPool.has(dependency.targetId)
    ) &&
    specification.assetSpecifications.every((entry) =>
      entry.dependencyTargets.every((targetId) => dependencyPool.has(targetId))
    );
  const specificationsComplete = specification.assetSpecifications.every(isWorkPackageComplete);
  const deterministicOrdering = specification.assetSpecifications.every((entry, index, entries) => {
    if (index === 0) {
      return true;
    }
    return entry.creationOrder > entries[index - 1].creationOrder;
  });
  const validationPassed =
    assetsExist &&
    batchValid &&
    dependenciesValid &&
    specificationsComplete &&
    deterministicOrdering;

  return deepFreeze({
    schemaId: assetProductionSpecificationValidationSchemaId,
    assetsExist,
    batchValid,
    dependenciesValid,
    specificationsComplete,
    deterministicOrdering,
    validationPassed,
    deterministicSpecificationHash: computeDeterministicHash(
      buildBatchSpecificationSignature(specification)
    )
  });
}

function buildBatchSpecificationSignature(specification) {
  return [
    specification.specificationId,
    specification.batchId,
    specification.assetSpecifications.map((entry) => [
      entry.workPackageId,
      entry.assetId,
      entry.recipeId,
      entry.selectedVariant,
      entry.variants,
      entry.lodRequirements,
      entry.performanceBudget,
      entry.creationStage,
      entry.creationOrder,
      entry.dependencyTargets,
      entry.specification
    ]),
    specification.creationOrder,
    specification.dependencies
  ];
}

function resolveDependencyTargets(assetId, stage, batch) {
  if (stage === "FOUNDATION_ASSETS") {
    return [];
  }

  if (assetId === "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001") {
    return ["BUILDING_CIVIC_SPORTS_PAVILION_001"];
  }

  if (assetId === "PARK_TREATMENT_GREENERY_SET_001") {
    return ["BUILDING_CIVIC_SPORTS_PAVILION_001"];
  }

  if (assetId === "RESIDENTIAL_DETAIL_GARDEN_SET_001") {
    return [
      "TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001",
      "PARK_TREATMENT_GREENERY_SET_001"
    ];
  }

  return batch.dependencies
    .map((dependency) => dependency.targetId)
    .filter((targetId) => targetId !== assetId);
}

function isWorkPackageComplete(entry) {
  return (
    typeof entry.assetId === "string" &&
    typeof entry.recipeId === "string" &&
    Array.isArray(entry.variants) &&
    entry.variants.length > 0 &&
    Array.isArray(entry.lodRequirements) &&
    entry.lodRequirements.length > 0 &&
    Boolean(entry.performanceBudget) &&
    Array.isArray(entry.validationRequirements) &&
    entry.validationRequirements.length > 0 &&
    Boolean(entry.creationRequest) &&
    entry.creationRequest.state === "APPROVED" &&
    Object.keys(entry.specification ?? {}).length > 0
  );
}

function missingPerAssetDefinition(assetId) {
  throw createProductionSpecificationError(
    "missing_asset_production_body",
    `No production specification body exists for asset ${assetId}.`
  );
}

function compareAssetWorkPackages(left, right) {
  if (left.creationOrder !== right.creationOrder) {
    return left.creationOrder - right.creationOrder;
  }
  return left.assetId.localeCompare(right.assetId);
}

function stageIndex(stage) {
  if (stage === "FOUNDATION_ASSETS") {
    return 1;
  }
  if (stage === "SUPPORTING_ASSETS") {
    return 2;
  }
  return 3;
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({ batchId: defaultBatchId });
  }

  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createProductionSpecificationError(
      "invalid_asset_production_specification_options",
      "Asset production specification options must be an object when provided."
    );
  }

  return deepFreeze({
    batchId: rawOptions.batchId ? normalizeString(rawOptions.batchId) : defaultBatchId
  });
}

function normalizeBatchLayer(rawBatchLayer) {
  if (rawBatchLayer?.schemaId !== "ASSET_PRODUCTION_BATCH_LAYER_001") {
    throw createProductionSpecificationError(
      "invalid_asset_production_specification_batch_layer",
      "Asset production specification layer requires a valid Asset Production Batch layer."
    );
  }
  return rawBatchLayer;
}

function normalizeRegistry(rawRegistry) {
  if (rawRegistry?.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001") {
    throw createProductionSpecificationError(
      "invalid_asset_production_specification_registry",
      "Asset production specification layer requires a valid Asset Factory registry layer."
    );
  }
  return rawRegistry;
}

function normalizePipeline(rawPipeline) {
  if (rawPipeline?.schemaId !== "ASSET_CREATION_PIPELINE_LAYER_001") {
    throw createProductionSpecificationError(
      "invalid_asset_production_specification_pipeline",
      "Asset production specification layer requires a valid Asset Creation Pipeline layer."
    );
  }
  return rawPipeline;
}

function normalizeCreationSpecificationLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_CREATION_SPECIFICATION_LAYER_001") {
    throw createProductionSpecificationError(
      "invalid_asset_production_specification_creation_layer",
      "Asset production specification layer requires a valid Asset Creation Specification layer."
    );
  }
  return rawLayer;
}

function normalizeString(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createProductionSpecificationError(
      "invalid_asset_production_specification_string",
      "Expected a non-empty string."
    );
  }
  return value.trim().toUpperCase();
}

function sortKeys(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, Array.isArray(value[key]) ? [...value[key]] : value[key]])
  );
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createProductionSpecificationError(code, message) {
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
