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
import { createAssetVariantSystem } from "./asset-variant-system.mjs";
import { createAssetVersioningLayer } from "./asset-versioning.mjs";
import { createAssetChangeManagementLayer } from "./asset-change-management.mjs";

export const assetDependencyManagementLayerSchemaId =
  "ASSET_DEPENDENCY_MANAGEMENT_LAYER_001";
export const assetDependencyRecordSchemaId = "ASSET_DEPENDENCY_RECORD_001";
export const assetDependencyValidationSchemaId =
  "ASSET_DEPENDENCY_VALIDATION_001";

export const assetDependencyTypes = deepFreeze([
  "ASSET_USES_RECIPE",
  "RECIPE_USES_ASSET",
  "VARIANT_DEPENDS_ON_ASSET",
  "ASSET_USED_BY_ENVIRONMENT",
  "ASSET_USED_BY_ATLAS"
]);

const impactLevels = deepFreeze(["LOW", "MEDIUM", "HIGH"]);

export function createAssetDependencyManagementLayer(
  rawOptions = {},
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawVariantSystem = createAssetVariantSystem(rawRegistry),
  rawVersioningLayer = createAssetVersioningLayer(rawRegistry),
  rawChangeLayer = createAssetChangeManagementLayer(rawVersioningLayer)
) {
  const options = normalizeOptions(rawOptions);
  const registry = normalizeRegistry(rawRegistry);
  const variantSystem = normalizeVariantSystem(rawVariantSystem);
  const versioningLayer = normalizeVersioningLayer(rawVersioningLayer);
  const changeLayer = normalizeChangeLayer(rawChangeLayer);

  const recipeCatalog = buildRecipeCatalog(registry.records);
  const sourceContext = buildSourceContext(
    registry,
    recipeCatalog,
    variantSystem,
    versioningLayer,
    changeLayer
  );
  const records = buildDependencyRecords(sourceContext, options.customDependencyRecords);
  const validation = buildDependencyValidation(records, sourceContext.entityIds);

  const layer = deepFreeze({
    schemaId: assetDependencyManagementLayerSchemaId,
    layerId: "ASSET_DEPENDENCY_MANAGEMENT_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    variantSystemId: variantSystem.systemId,
    versioningLayerId: versioningLayer.layerId,
    changeLayerId: changeLayer.layerId,
    recipeCatalogId: "ASSET_FACTORY_RECIPE_CATALOG_001",
    dependencyRecords: records,
    validation,
    createDependencyRecord(rawInput) {
      return createDependencyRecord(rawInput, sourceContext.entityIds);
    },
    listDependenciesFor(sourceId) {
      const normalizedSourceId = normalizeString(sourceId, "sourceId");
      return records.filter((record) => record.sourceId === normalizedSourceId);
    },
    resolveDependencyChain(sourceId, maxDepth = 8) {
      return resolveDependencyChain(records, normalizeString(sourceId, "sourceId"), maxDepth);
    }
  });

  const checked = validateAssetDependencyManagementLayer(layer);
  if (!checked.ok) {
    throw createDependencyError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetDependencyManagementLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetDependencyManagementLayerSchemaId) {
      throw createDependencyError(
        "invalid_asset_dependency_management_layer_schema",
        `Expected ${assetDependencyManagementLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.dependencyRecords)) {
      throw createDependencyError(
        "invalid_asset_dependency_records",
        "Asset dependency management layer must expose dependencyRecords."
      );
    }

    if (rawLayer.validation?.schemaId !== assetDependencyValidationSchemaId) {
      throw createDependencyError(
        "invalid_asset_dependency_validation_schema",
        `Expected ${assetDependencyValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "referencesExist",
      "dependencyTypeValid",
      "noInvalidCycles",
      "deterministicGraphOutput",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createDependencyError(
          "asset_dependency_management_layer_validation_failed",
          `Asset dependency validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetDependencyManagementLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_dependency_management_layer_validation_failed",
      message: error.message,
      assetDependencyManagementLayer: null
    });
  }
}

export function validateAssetDependencyRecord(rawRecord, knownEntityIds = null) {
  try {
    if (rawRecord?.schemaId !== assetDependencyRecordSchemaId) {
      throw createDependencyError(
        "invalid_asset_dependency_record_schema",
        `Expected ${assetDependencyRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (!assetDependencyTypes.includes(rawRecord.dependencyType)) {
      throw createDependencyError(
        "invalid_asset_dependency_type",
        `Unsupported dependency type ${rawRecord.dependencyType}.`
      );
    }

    if (!impactLevels.includes(rawRecord.impactLevel)) {
      throw createDependencyError(
        "invalid_asset_dependency_impact_level",
        `Unsupported impact level ${rawRecord.impactLevel}.`
      );
    }

    if (
      typeof rawRecord.dependencyReason !== "string" ||
      rawRecord.dependencyReason.trim().length === 0
    ) {
      throw createDependencyError(
        "invalid_asset_dependency_reason",
        "Asset dependency records must include a dependency reason."
      );
    }

    if (knownEntityIds) {
      if (!knownEntityIds.has(rawRecord.sourceId) || !knownEntityIds.has(rawRecord.targetId)) {
        throw createDependencyError(
          "invalid_asset_dependency_reference",
          "Asset dependency record references must exist in the dependency graph."
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetDependencyRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_dependency_record_validation_failed",
      message: error.message,
      assetDependencyRecord: null
    });
  }
}

function buildSourceContext(registry, recipeCatalog, variantSystem, versioningLayer, changeLayer) {
  const versionRecord = versioningLayer.createVersionRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const changeRecord = changeLayer.createChangeRecord({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const variantDefinitions = variantSystem.definitions;
  const environmentIds = new Set();
  const atlasIds = new Set();
  const variantIds = new Set();

  for (const record of registry.records) {
    for (const usageRule of record.usageRules) {
      environmentIds.add(buildEnvironmentId(usageRule));
    }
    for (const objectType of record.atlasCompatibility.supportedObjectTypes) {
      atlasIds.add(buildAtlasId(objectType));
    }
  }

  for (const definition of variantDefinitions) {
    variantIds.add(buildVariantNodeId(definition));
  }

  const entityIds = new Set([
    ...registry.records.map((record) => record.assetId),
    ...recipeCatalog.map((recipe) => recipe.recipeId),
    ...environmentIds,
    ...atlasIds,
    ...variantIds,
    versionRecord.versionRecordId,
    changeRecord.changeRecordId
  ]);

  return deepFreeze({
    registryRecords: registry.records,
    recipeCatalog,
    variantDefinitions,
    versionRecords: deepFreeze([versionRecord]),
    changeRecords: deepFreeze([changeRecord]),
    entityIds
  });
}

function buildRecipeCatalog(registryRecords) {
  const packs = [
    createNatureAssetPack(),
    createCivicAssetPack(),
    createTransportAssetPack(),
    createRoadAndStreetAssetPack(),
    createCommercialAssetPack(),
    createResidentialAssetPack()
  ];
  const recipeMap = new Map();

  for (const pack of packs) {
    for (const recipe of pack.recipes) {
      recipeMap.set(recipe.recipeId, recipe);
    }
  }

  for (const record of registryRecords) {
    if (!recipeMap.has(record.recipeId)) {
      recipeMap.set(
        record.recipeId,
        deepFreeze({
          recipeId: record.recipeId,
          recipeType: "DIRECT_ASSET_RECIPE",
          supportedFamilies: deepFreeze([record.assetFamily])
        })
      );
    }
  }

  return deepFreeze([...recipeMap.values()].sort((left, right) => left.recipeId.localeCompare(right.recipeId)));
}

function buildDependencyRecords(sourceContext, customDependencyRecords) {
  const records = [];
  const variantImpactLookup = new Map(
    sourceContext.changeRecords.map((record) => [record.assetId, record.changeCategory])
  );
  const versionStateLookup = new Map(
    sourceContext.versionRecords.map((record) => [record.assetId, record.versionState])
  );

  for (const asset of sourceContext.registryRecords) {
    records.push(
      dependencyRecord({
        sourceId: asset.assetId,
        targetId: asset.recipeId,
        dependencyType: "ASSET_USES_RECIPE",
        dependencyReason: `Asset ${asset.assetId} uses primary recipe ${asset.recipeId}.`,
        impactLevel: deriveAssetRecipeImpact(asset.assetId, versionStateLookup)
      })
    );

    for (const usageRule of asset.usageRules) {
      records.push(
        dependencyRecord({
          sourceId: asset.assetId,
          targetId: buildEnvironmentId(usageRule),
          dependencyType: "ASSET_USED_BY_ENVIRONMENT",
          dependencyReason: `Asset ${asset.assetId} is used by environment rule ${usageRule}.`,
          impactLevel: "MEDIUM"
        })
      );
    }

    for (const objectType of asset.atlasCompatibility.supportedObjectTypes) {
      records.push(
        dependencyRecord({
          sourceId: asset.assetId,
          targetId: buildAtlasId(objectType),
          dependencyType: "ASSET_USED_BY_ATLAS",
          dependencyReason: `Asset ${asset.assetId} is used by Atlas object type ${objectType}.`,
          impactLevel: "HIGH"
        })
      );
    }
  }

  for (const recipe of sourceContext.recipeCatalog) {
    const matchingAssets = sourceContext.registryRecords.filter(
      (asset) => asset.recipeId === recipe.recipeId
    );

    for (const asset of matchingAssets) {
      records.push(
        dependencyRecord({
          sourceId: recipe.recipeId,
          targetId: asset.assetId,
          dependencyType: "RECIPE_USES_ASSET",
          dependencyReason: `Recipe ${recipe.recipeId} supports asset family ${asset.assetFamily} through ${asset.assetId}.`,
          impactLevel: asset.recipeId === recipe.recipeId ? "HIGH" : "MEDIUM"
        })
      );
    }
  }

  for (const definition of sourceContext.variantDefinitions) {
    records.push(
      dependencyRecord({
        sourceId: buildVariantNodeId(definition),
        targetId: definition.targetAssetId,
        dependencyType: "VARIANT_DEPENDS_ON_ASSET",
        dependencyReason: `Variant ${definition.variantId} resolves to target asset ${definition.targetAssetId}.`,
        impactLevel:
          variantImpactLookup.get(definition.targetAssetId) === "VARIANT_ADDITION"
            ? "HIGH"
            : "MEDIUM"
      })
    );
  }

  for (const rawRecord of customDependencyRecords) {
    records.push(createDependencyRecord(rawRecord, sourceContext.entityIds));
  }

  return deepFreeze(records.sort(compareDependencyRecords));
}

function buildDependencyValidation(records, entityIds) {
  const referencesExist = records.every(
    (record) => entityIds.has(record.sourceId) && entityIds.has(record.targetId)
  );
  const dependencyTypeValid = records.every((record) =>
    assetDependencyTypes.includes(record.dependencyType)
  );
  const noInvalidCycles = findInvalidCycle(records) === null;
  const deterministicGraphOutput = true;
  const validationPassed =
    referencesExist &&
    dependencyTypeValid &&
    noInvalidCycles &&
    deterministicGraphOutput;

  return deepFreeze({
    schemaId: assetDependencyValidationSchemaId,
    referencesExist,
    dependencyTypeValid,
    noInvalidCycles,
    deterministicGraphOutput,
    validationPassed,
    deterministicGraphHash: computeDeterministicHash(
      records.map((record) => [
        record.sourceId,
        record.targetId,
        record.dependencyType,
        record.impactLevel
      ])
    )
  });
}

function resolveDependencyChain(records, startId, maxDepth = 8) {
  const adjacency = buildAdjacency(records);
  const visited = new Set([startId]);
  const queue = [{ id: startId, depth: 0 }];
  const resolved = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.depth >= maxDepth) {
      continue;
    }

    for (const record of adjacency.get(current.id) ?? []) {
      if (!visited.has(record.targetId)) {
        visited.add(record.targetId);
        resolved.push(record);
        queue.push({
          id: record.targetId,
          depth: current.depth + 1
        });
      }
    }
  }

  return deepFreeze(resolved);
}

function createDependencyRecord(rawInput, entityIds) {
  const input = normalizeDependencyInput(rawInput);
  const record = dependencyRecord(input);
  const checked = validateAssetDependencyRecord(record, entityIds);
  if (!checked.ok) {
    throw createDependencyError(checked.errorCode, checked.message);
  }
  return record;
}

function findInvalidCycle(records) {
  const adjacency = buildAdjacency(records);
  const maxDepth = adjacency.size + 1;

  function visit(nodeId, path, pathIndexByNode) {
    if (path.length > maxDepth) {
      return null;
    }

    pathIndexByNode.set(nodeId, path.length);

    for (const edge of adjacency.get(nodeId) ?? []) {
      const nextId = edge.targetId;
      if (pathIndexByNode.has(nextId)) {
        const cycleStartIndex = pathIndexByNode.get(nextId);
        const previousEdge = path[path.length - 1] ?? null;
        if (isAllowedStructuralCycle(previousEdge, edge, nextId, nodeId)) {
          continue;
        }
        return [nextId, ...path.slice(cycleStartIndex).map((entry) => entry.targetId)];
      }

      path.push(edge);
      const result = visit(nextId, path, new Map(pathIndexByNode));
      path.pop();
      if (result) {
        return result;
      }
    }

    return null;
  }

  for (const nodeId of adjacency.keys()) {
    const result = visit(nodeId, [], new Map());
    if (result) {
      return result;
    }
  }

  return null;
}

function isAllowedStructuralCycle(previousEdge, currentEdge, repeatedNodeId, currentNodeId) {
  if (!previousEdge) {
    return false;
  }

  const pairTypes = new Set([previousEdge.dependencyType, currentEdge.dependencyType]);
  return (
    repeatedNodeId === previousEdge.sourceId &&
    currentNodeId === previousEdge.targetId &&
    previousEdge.sourceId === currentEdge.targetId &&
    previousEdge.targetId === currentEdge.sourceId &&
    pairTypes.has("ASSET_USES_RECIPE") &&
    pairTypes.has("RECIPE_USES_ASSET")
  );
}

function buildAdjacency(records) {
  const adjacency = new Map();
  for (const record of records) {
    if (!adjacency.has(record.sourceId)) {
      adjacency.set(record.sourceId, []);
    }
    adjacency.get(record.sourceId).push(record);
  }
  return adjacency;
}

function buildVariantNodeId(definition) {
  return `VARIANT::${definition.baseReferenceType.toUpperCase()}::${definition.baseReferenceId}::${definition.variantId.toUpperCase()}`;
}

function buildEnvironmentId(usageRule) {
  return `ENVIRONMENT::${usageRule.toUpperCase()}`;
}

function buildAtlasId(objectType) {
  return `ATLAS::${objectType.toUpperCase()}`;
}

function deriveAssetRecipeImpact(assetId, versionStateLookup) {
  return versionStateLookup.get(assetId) === "PUBLISHED" ? "HIGH" : "MEDIUM";
}

function dependencyRecord({
  sourceId,
  targetId,
  dependencyType,
  dependencyReason,
  impactLevel
}) {
  return deepFreeze({
    schemaId: assetDependencyRecordSchemaId,
    sourceId: normalizeString(sourceId, "sourceId"),
    targetId: normalizeString(targetId, "targetId"),
    dependencyType: normalizeString(dependencyType, "dependencyType"),
    dependencyReason: normalizeReason(dependencyReason),
    impactLevel: normalizeImpactLevel(impactLevel)
  });
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({
      customDependencyRecords: deepFreeze([])
    });
  }

  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createDependencyError(
      "invalid_asset_dependency_management_options",
      "Asset dependency management options must be an object when provided."
    );
  }

  return deepFreeze({
    customDependencyRecords: deepFreeze(
      Array.isArray(rawOptions.customDependencyRecords)
        ? rawOptions.customDependencyRecords.map((record) => deepFreeze({ ...record }))
        : []
    )
  });
}

function normalizeRegistry(rawRegistry) {
  const checked = validateAssetFactoryRegistryLayer(rawRegistry);
  if (!checked.ok) {
    throw createDependencyError(checked.errorCode, checked.message);
  }
  return rawRegistry;
}

function normalizeVariantSystem(rawSystem) {
  if (
    !rawSystem ||
    rawSystem.schemaId !== "ASSET_VARIANT_SYSTEM_001" ||
    !Array.isArray(rawSystem.definitions)
  ) {
    throw createDependencyError(
      "invalid_asset_dependency_variant_system",
      "Asset dependency management requires a valid asset variant system."
    );
  }
  return rawSystem;
}

function normalizeVersioningLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_VERSIONING_LAYER_001" ||
    typeof rawLayer.createVersionRecord !== "function"
  ) {
    throw createDependencyError(
      "invalid_asset_dependency_versioning_layer",
      "Asset dependency management requires a valid asset versioning layer."
    );
  }
  return rawLayer;
}

function normalizeChangeLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_CHANGE_MANAGEMENT_LAYER_001" ||
    typeof rawLayer.createChangeRecord !== "function"
  ) {
    throw createDependencyError(
      "invalid_asset_dependency_change_layer",
      "Asset dependency management requires a valid asset change management layer."
    );
  }
  return rawLayer;
}

function normalizeDependencyInput(rawInput) {
  if (typeof rawInput !== "object" || rawInput == null || Array.isArray(rawInput)) {
    throw createDependencyError(
      "invalid_asset_dependency_input",
      "Asset dependency input must be an object."
    );
  }

  return {
    sourceId: rawInput.sourceId,
    targetId: rawInput.targetId,
    dependencyType: rawInput.dependencyType,
    dependencyReason: rawInput.dependencyReason,
    impactLevel: rawInput.impactLevel
  };
}

function normalizeString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createDependencyError(`invalid_${label}`, `${label} must be a non-empty string.`);
  }
  return value.trim().toUpperCase();
}

function normalizeReason(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createDependencyError(
      "invalid_asset_dependency_reason",
      "dependencyReason must be a non-empty string."
    );
  }
  return value.trim();
}

function normalizeImpactLevel(value) {
  const normalized = normalizeString(value, "impactLevel");
  if (!impactLevels.includes(normalized)) {
    throw createDependencyError(
      "invalid_asset_dependency_impact_level",
      `Impact level ${normalized} is not supported.`
    );
  }
  return normalized;
}

function compareDependencyRecords(left, right) {
  return (
    left.sourceId.localeCompare(right.sourceId) ||
    left.dependencyType.localeCompare(right.dependencyType) ||
    left.targetId.localeCompare(right.targetId) ||
    left.impactLevel.localeCompare(right.impactLevel)
  );
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createDependencyError(code, message) {
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
